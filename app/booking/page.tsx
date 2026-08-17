'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { mastersApi, bookingsApi, citiesApi, savedAddressesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { uploadFile } from '@/lib/api/upload';
import type { City, MasterPublic, MasterService, SavedAddress } from '@/lib/api/types';

const MAX_ATTACHMENTS = 5;
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getAvatarUrl } from '@/lib/placeholders';
import { useMoney } from '@/lib/money';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DatePicker, todayISO } from '@/components/ui/date-picker';
import { PhoneField } from '@/components/ui/PhoneField';
import { PaymentDialog } from '@/components/payments/PaymentDialog';
import { compressImage } from '@/lib/images/compress';
import dynamic from 'next/dynamic';
import {
  buildAddressSchema,
  normalizePhone,
  validateAddress,
  type AddressField,
} from '@/lib/validation/booking';
import { Skeleton } from '@/components/ui/skeleton';

/** Leaflet touches `window` at import time, so the map only ever loads in the browser. */
const BookingAddressMap = dynamic(() => import('@/components/booking/BookingAddressMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full rounded-2xl" />,
});

// The backend rejects bookings made less than 2 hours in advance (SLOT_TOO_SOON).
const MIN_BOOKING_ADVANCE_MS = 2 * 60 * 60 * 1000;

function formatSlotLabel(iso: string, durationMinutes?: number): string {
  const start = new Date(iso);
  const startLabel = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (durationMinutes) {
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const endLabel = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${startLabel} - ${endLabel}`;
  }
  return startLabel;
}

const FIELD_INPUT =
  'w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition';

/** What a field looks like once the schema has rejected it. */
const INVALID_FIELD = 'border-rose-400 bg-rose-50/60 focus:ring-rose-400/40 focus:border-rose-500 dark:border-rose-800 dark:bg-rose-950/30';

/**
 * One labelled field, with room reserved for the message it may need.
 *
 * The label carries a red asterisk because every field on the address step is required —
 * the reader should be able to see that before they press anything, not after.
 */
function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label} <span className="text-rose-500">*</span>
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <Icon name="AlertTriangle" size={12} />
          {error}
        </p>
      ) : (
        hint && <p className="text-[10px] text-slate-400">{hint}</p>
      )}
    </div>
  );
}

/**
 * One attached photo, from the moment it is chosen.
 *
 * The preview exists before the upload does — the picture appears the instant the file
 * is picked, and the tile carries its own progress. The old flow held one boolean for
 * the whole set, disabled the picker while it was true, and showed nothing at all until
 * the round-trip finished, so attaching three photos was three sequential waits in front
 * of an empty box.
 */
interface Attachment {
  /** Stable key for React — the object URL, which is unique per file. */
  previewUrl: string;
  fileId: string | null;
  status: 'uploading' | 'done' | 'error';
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-sky-400 animate-spin ${className}`}
    />
  );
}

export default function BookingWizardPage() {
  const t = useTranslations('booking');
  const { money, perHour } = useMoney();
  const searchParams = useSearchParams();
  const preselectedMasterId = searchParams.get('master');
  const preselectedServiceId = searchParams.get('service');
  const { user } = useRequireAuth(['CLIENT']);

  const [step, setStep] = useState<number>(1);

  const [master, setMaster] = useState<MasterPublic | null>(null);
  const [masterLoading, setMasterLoading] = useState(!!preselectedMasterId);
  const [masterError, setMasterError] = useState<string | null>(null);

  const [services, setServices] = useState<MasterService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  const [date, setDate] = useState<string>(todayISO);
  const [slots, setSlots] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [timeSlot, setTimeSlot] = useState<string>('');

  const [jobNotes, setJobNotes] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---- Address step: city → district (from the client's registered city) ----
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
  const [addressPoint, setAddressPoint] = useState<[number, number] | null>(null);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<AddressField, string>>>({});

  /**
   * The address step, validated as a whole rather than as one `disabled` attribute.
   *
   * The schema is memoised on `t` so switching language rebuilds the messages without
   * rebuilding it on every keystroke.
   */
  const addressSchema = useMemo(
    () =>
      buildAddressSchema({
        city: t('vCityRequired'),
        district: t('vDistrictRequired'),
        street: t('vStreetRequired'),
        streetShort: t('vStreetShort'),
        house: t('vHouseRequired'),
        phone: t('vPhoneRequired'),
        phoneInvalid: t('vPhoneInvalid'),
      }),
    [t],
  );

  const addressValues = { cityId, district, street, house, contactPhone };

  /** Clears one field's error the moment it is edited — an error that outlives the fix
      trains people to ignore the whole colour. */
  const clearAddressError = (field: AddressField) =>
    setAddressErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleAddressContinue = async () => {
    const errors = await validateAddress(addressSchema, addressValues);
    setAddressErrors(errors);
    if (Object.keys(errors).length === 0) setStep(4);
  };

  const applySavedAddress = (address: SavedAddress) => {
    setSelectedSavedAddressId(address.id);
    setCityId(address.cityId);
    setDistrict(address.addressDistrict);
    setStreet(address.addressLine);
    setHouse('');
    if (address.contactPhone) setContactPhone(address.contactPhone);
    setAddressErrors({});
  };

  useEffect(() => {
    citiesApi
      .list()
      .then((list) => {
        setCities(list);
        const registeredCityId = user?.clientProfile?.cityId;
        if (registeredCityId && list.some((city) => city.id === registeredCityId)) {
          setCityId(registeredCityId);
        }
      })
      .catch(() => setCities([]));
    savedAddressesApi
      .list()
      .then((list) => {
        setSavedAddresses(list);
        const defaultAddress = list.find((a) => a.isDefault);
        if (defaultAddress) applySavedAddress(defaultAddress);
      })
      .catch(() => setSavedAddresses([]));
  }, [user?.clientProfile?.cityId]);

  const activeCity = cities.find((city) => city.id === cityId) ?? null;
  const activeDistricts = activeCity?.districts ?? [];
  const composedAddressLine = [street, house].filter(Boolean).join(', ').trim();

  // Load the preselected master
  useEffect(() => {
    if (!preselectedMasterId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setMasterLoading(true);
    setMasterError(null);
    mastersApi
      .byId(preselectedMasterId)
      .then((m) => {
        if (!cancelled) setMaster(m);
      })
      .catch((err) => {
        if (!cancelled) setMasterError(err instanceof ApiError ? err.message : t('masterLoadFailed'));
      })
      .finally(() => {
        if (!cancelled) setMasterLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preselectedMasterId]);

  // Load the master's services
  useEffect(() => {
    if (!preselectedMasterId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setServicesLoading(true);
    mastersApi
      .services(preselectedMasterId)
      .then((list) => {
        if (cancelled) return;
        setServices(list);
        const preselected = preselectedServiceId && list.some((s) => s.id === preselectedServiceId)
          ? preselectedServiceId
          : list[0]?.id;
        if (preselected) setSelectedServiceId((prev) => prev || preselected);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      })
      .finally(() => {
        if (!cancelled) setServicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preselectedMasterId, preselectedServiceId]);

  // Load availability for the selected date + service
  useEffect(() => {
    if (!preselectedMasterId || !date || !selectedServiceId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setSlotsLoading(true);
    setTimeSlot('');
    mastersApi
      .availability(preselectedMasterId, date, date, selectedServiceId)
      .then((days) => {
        if (cancelled) return;
        const day = days.find((d) => d.date === date);
        const cutoff = Date.now() + MIN_BOOKING_ADVANCE_MS;
        setSlots((day?.free ?? []).filter((slot) => new Date(slot).getTime() >= cutoff));
        setBusySlots(day?.busy ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          setBusySlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preselectedMasterId, date, selectedServiceId]);

  const selectedService = services.find((s) => s.id === selectedServiceId) || null;
  const totalPrice = selectedService ? Number(selectedService.price) || 0 : 0;

  /**
   * Pick photos → see them → they upload behind you.
   *
   * Three things make this fast where the old one was slow: the whole selection is
   * accepted at once, each file is re-encoded to 1600 px before it is sent (a 6 MB camera
   * shot becomes ~300 KB), and the uploads run together rather than one after another.
   * The reader waits for none of it — the tiles are on screen before the first byte goes
   * out, and the only thing that has to finish before "confirm" is the upload itself.
   */
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (picked.length === 0) return;

    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      setAttachmentError(t('attachmentsLimitReached'));
      return;
    }
    const files = picked.slice(0, room);
    setAttachmentError(files.length < picked.length ? t('attachmentsLimitReached') : null);

    const started = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [
      ...prev,
      ...started.map(({ previewUrl }) => ({ previewUrl, fileId: null, status: 'uploading' as const })),
    ]);

    await Promise.all(
      started.map(async ({ file, previewUrl }) => {
        try {
          const fileId = await uploadFile(await compressImage(file), 'BOOKING_ATTACHMENT');
          setAttachments((prev) =>
            prev.map((a) => (a.previewUrl === previewUrl ? { ...a, fileId, status: 'done' } : a)),
          );
        } catch (err) {
          setAttachmentError(err instanceof ApiError ? err.message : t('attachmentUploadFailed'));
          setAttachments((prev) =>
            prev.map((a) => (a.previewUrl === previewUrl ? { ...a, status: 'error' } : a)),
          );
        }
      }),
    );
  };

  const removeAttachment = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    setAttachments((prev) => prev.filter((a) => a.previewUrl !== previewUrl));
  };

  const uploadedFileIds = attachments
    .filter((a) => a.status === 'done' && a.fileId)
    .map((a) => a.fileId as string);
  const attachmentsUploading = attachments.some((a) => a.status === 'uploading');

  const handleConfirm = async () => {
    if (!preselectedMasterId || !selectedServiceId || !timeSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await bookingsApi.create({
        masterId: preselectedMasterId,
        serviceId: selectedServiceId,
        scheduledAt: timeSlot,
        address: {
          cityId,
          district,
          line: composedAddressLine,
          contactPhone: normalizePhone(contactPhone),
          // The pin, when the client dropped one. `POST /bookings` has always accepted
          // these two and nothing was sending them, so a master got a street name and
          // had to guess the building.
          ...(addressPoint ? { latitude: addressPoint[0], longitude: addressPoint[1] } : {}),
        },
        note: jobNotes || undefined,
        attachmentKeys: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
      });
      setCreatedBookingId(created.id);
      setBookingConfirmed(true);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : t('genericError');
      setSubmitError(message);
      // Rethrown on purpose: the payment sheet is waiting on this promise and shows the
      // failure with the card still filled in, instead of closing on a booking that
      // was never created.
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // No master selected via ?master= — this wizard assumes a preselected craftsman.
  if (!preselectedMasterId) {
    return (
      <div className="page-shell page-shell-narrow py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <Icon name="Search" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('noMasterTitle')}</h1>
        <p className="text-sm text-slate-500">{t('noMasterDesc')}</p>
        <Link
          href="/search"
          className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          {t('browseCraftsmen')}
        </Link>
      </div>
    );
  }

  if (masterLoading) {
    return (
      <div className="page-shell page-shell-narrow py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (masterError || !master) {
    return (
      <div className="page-shell page-shell-narrow py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <Icon name="X" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{masterError ?? t('craftsmanNotFound')}</h1>
        <Link
          href="/search"
          className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          {t('browseCraftsmen')}
        </Link>
      </div>
    );
  }

  /**
   * What the reader has chosen so far, for the rail beside the form. A four-step
   * checkout that never shows the running total makes people scroll back a step to
   * check what they picked — so the summary follows them down instead.
   */
  const summaryRows = [
    { label: t('craftsman'), value: master.displayName },
    { label: t('serviceWord'), value: selectedService?.title ?? null },
    {
      label: t('scheduledDate'),
      value: date ? `${date}${timeSlot ? ` · ${formatSlotLabel(timeSlot, selectedService?.durationMinutes)}` : ''}` : null,
    },
    { label: t('serviceAddress'), value: street ? `${street}${house ? `, ${house}` : ''}` : null },
  ].filter((r) => r.value);

  return (
    <div className="page-shell py-12">

      {/* Page Title */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
          {t('instantCheckout')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('pageTitle')}
        </h1>
      </div>

      <div className={cn('mt-8 grid items-start gap-8', !bookingConfirmed && 'lg:grid-cols-[1fr_320px]')}>
        <div className="min-w-0 space-y-8">

      {/* Step Progress Bar.
          The label sits under its own dot, and the rail is drawn as two half
          segments per step — so the line joins circle to circle and never runs
          through a word. (It used to be one absolute bar behind everything, masked
          by a white pill that stopped applying at `sm`, which is why the desktop
          layout had a line struck through every label.) */}
      {!bookingConfirmed && (
        <ol className="flex items-start pb-6">
          {[
            { num: 1, label: t('stepService') },
            { num: 2, label: t('stepSchedule') },
            { num: 3, label: t('stepLocation') },
            { num: 4, label: t('stepConfirmation') },
          ].map((s, idx, all) => {
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            const railBase = 'absolute top-4 h-0.5 -translate-y-1/2 rounded-full transition-colors duration-500';

            return (
              <li key={s.num} className="relative flex-1 flex flex-col items-center gap-2.5 text-center">
                {idx > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      railBase,
                      'left-0 right-1/2 mr-5',
                      step >= s.num ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800',
                    )}
                  />
                )}
                {idx < all.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      railBase,
                      'left-1/2 right-0 ml-5',
                      isDone ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800',
                    )}
                  />
                )}

                <motion.div
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'relative w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition-colors',
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-600/15'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500',
                  )}
                >
                  {isDone ? <Icon name="check" size={15} className="stroke-[3]" /> : s.num}
                </motion.div>

                <span
                  className={cn(
                    'px-1 text-[10px] sm:text-xs font-bold leading-tight transition-colors',
                    isCurrent
                      ? 'text-blue-600 dark:text-sky-400'
                      : isDone
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Confirmation View Screen */}
      {bookingConfirmed ? (
        <Card className="p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-2xl animate-fade-in">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            className="relative w-20 h-20 mx-auto"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" />
            <div className="relative w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-lg">
              <Icon name="CheckCircle2" size={48} />
            </div>
          </motion.div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('confirmedTitle')}</h2>
            <p className="text-sm text-slate-500">{t('confirmedDesc')}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl text-left text-xs space-y-3 border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('master')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{master.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('scheduledDate')}</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {date} ({formatSlotLabel(timeSlot, selectedService?.durationMinutes)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('totalPrice')}</span>
              <span className="font-extrabold text-blue-600 dark:text-sky-400">
                {money(totalPrice)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              href={`/booking/${createdBookingId}`}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
            >
              {t('trackBooking')}
            </Link>
            <Link
              href="/home"
              className="px-8 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('backToHome')}
            </Link>
          </div>
        </Card>
      ) : (
        /* Booking Step Form Wrapper */
        <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">

          {/* STEP 1: Select Master & Service */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step1Heading')}</h3>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('chosenCraftsman')}</label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {/* The master's own photograph when they have uploaded one — this card
                      showed their initials even for masters with an avatar, because it
                      never read `avatarUrl`. */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not an optimizable static asset */}
                  <img
                    src={master.avatarUrl || getAvatarUrl(master.id, master.displayName)}
                    alt={master.displayName}
                    className="w-14 h-14 rounded-2xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{master.displayName}</h4>
                    <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">
                      {master.categories?.join(', ')}
                    </p>
                    {master.priceFrom && (
                      <span className="text-xs text-slate-500 font-bold">{t('priceFromLabel', { price: perHour(master.priceFrom) })}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('selectServiceLabel')}</label>
                {servicesLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {t('noBookableServices')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((svc) => {
                      const isSelected = selectedServiceId === svc.id;
                      return (
                        /* `unstyled`, not `ghost`: this card paints its own background,
                           and a ghost button's hover fill would replace the selected
                           blue with near-white — the selected service disappeared the
                           moment the pointer touched it. `flex-col items-start` because
                           the Button base is an inline-flex row, which laid the title and
                           the price side by side: "Pipe repair250,00 somoni". */
                        <Button size="raw" variant="unstyled"
                          key={svc.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelectedServiceId(svc.id)}
                          className={cn(
                            'flex flex-col items-start gap-0.5 rounded-2xl border p-3.5 text-left text-xs font-bold transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5',
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:bg-slate-700/70',
                          )}
                        >
                          <span className="whitespace-normal">{svc.title}</span>
                          <span className={isSelected ? 'text-blue-100' : 'text-slate-400'}>
                            {money(svc.price)}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('jobDescription')}</label>
                <Textarea
                  rows={3}
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  placeholder={t('jobDescriptionPlaceholder')}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('attachPhotosLabel')}</label>
                <div className="flex flex-wrap gap-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.previewUrl}
                      className="group relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- transient local object URL, not an optimizable remote asset */}
                      <img
                        src={attachment.previewUrl}
                        alt=""
                        className={cn(
                          'w-full h-full object-cover transition-opacity duration-300',
                          attachment.status !== 'done' && 'opacity-50',
                        )}
                      />
                      {/* The tile carries its own state: the picture is already there, the
                          upload is still happening on top of it. */}
                      {attachment.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-900/40">
                          <Spinner className="w-5 h-5" />
                        </div>
                      )}
                      {attachment.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-rose-500/25 text-rose-600 dark:text-rose-300">
                          <Icon name="AlertTriangle" size={18} />
                        </div>
                      )}
                      <Button size="raw" variant="unstyled"
                        type="button"
                        aria-label={t('attachmentRemove')}
                        onClick={() => removeAttachment(attachment.previewUrl)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center transition hover:bg-black/80"
                      >
                        <Icon name="X" size={10} />
                      </Button>
                    </div>
                  ))}
                  {attachments.length < MAX_ATTACHMENTS && (
                    <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition text-slate-400">
                      <Icon name="image" size={20} />
                      <span className="text-[9px] font-bold uppercase tracking-wide">
                        {MAX_ATTACHMENTS - attachments.length}
                      </span>
                      {/* `multiple`: choosing three photos used to mean opening this
                          picker three times and waiting for each upload in turn. */}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAttachmentUpload}
                      />
                    </label>
                  )}
                </div>
                {attachmentError && <p className="text-[10px] font-bold text-red-600 dark:text-red-400">{attachmentError}</p>}
                <p className="text-[10px] text-slate-400">{t('attachPhotosHint', { max: MAX_ATTACHMENTS })}</p>
              </div>

              <Button size="raw" variant="ghost"
                onClick={() => setStep(2)}
                disabled={!selectedServiceId}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition btn-ripple"
              >
                {t('continueToSchedule')}
              </Button>
            </div>
          )}

          {/* STEP 2: Schedule Date & Time */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step2Heading')}</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('appointmentDate')}</label>
                <DatePicker
                  value={date}
                  min={todayISO()}
                  onChange={setDate}
                  aria-label={t('appointmentDate')}
                  className="p-4 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('availableTimeSlots')}</label>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : slots.length === 0 && busySlots.length === 0 ? (
                  <p className="flex items-center gap-2 text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Icon name="calendar" size={14} className="shrink-0 text-slate-400" />
                    {t('noSlots')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const isSelected = timeSlot === slot;
                      return (
                        <Button size="raw" variant="unstyled"
                          key={slot}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setTimeSlot(slot)}
                          className={cn(
                            'p-3.5 rounded-2xl text-xs font-bold border transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5',
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-white hover:shadow-md dark:hover:border-sky-800 dark:hover:bg-slate-700/70',
                          )}
                        >
                          {formatSlotLabel(slot, selectedService?.durationMinutes)}
                        </Button>
                      );
                    })}
                    {busySlots.map((slot) => (
                      <div
                        key={slot}
                        className="p-3.5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 line-through flex items-center justify-between"
                      >
                        <span>{formatSlotLabel(slot, selectedService?.durationMinutes)}</span>
                        <span className="normal-case text-[10px] font-extrabold uppercase tracking-wide text-red-500 dark:text-red-400">
                          {t('busy')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button size="raw" variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {t('back')}
                </Button>
                <Button size="raw" variant="ghost"
                  onClick={() => setStep(3)}
                  disabled={!timeSlot}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition btn-ripple"
                >
                  {t('continueToAddress')}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Address */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step3Heading')}</h3>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('savedAddressesLabel')}</span>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((address) => (
                      <Button size="raw" variant="unstyled"
                        key={address.id}
                        type="button"
                        aria-pressed={selectedSavedAddressId === address.id}
                        onClick={() => applySavedAddress(address)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-xs font-bold border transition-colors duration-200',
                          selectedSavedAddressId === address.id
                            ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-300 hover:bg-white dark:hover:border-sky-700 dark:hover:bg-slate-700/70',
                        )}
                      >
                        {address.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Every field here is required and every one says so, both with the
                  asterisk on its label and — once "review order" has been pressed — with
                  its own message underneath. The step used to gate on district and street
                  alone, so a master could be sent to a street with no building number and
                  no phone to ring. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('cityLabel')} error={addressErrors.cityId}>
                  <Select
                    value={cityId || undefined}
                    onValueChange={(value) => {
                      setCityId(value);
                      setDistrict('');
                      setSelectedSavedAddressId(null);
                      clearAddressError('cityId');
                    }}
                  >
                    <SelectTrigger
                      className={cn('w-full p-4 rounded-2xl text-xs font-bold', addressErrors.cityId && INVALID_FIELD)}
                    >
                      <SelectValue placeholder={t('selectCity')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t('districtLabel')} error={addressErrors.district}>
                  <Select
                    value={district || undefined}
                    onValueChange={(value) => {
                      setDistrict(value);
                      clearAddressError('district');
                    }}
                    disabled={!activeCity}
                  >
                    <SelectTrigger
                      className={cn('w-full p-4 rounded-2xl text-xs font-bold', addressErrors.district && INVALID_FIELD)}
                    >
                      <SelectValue placeholder={t('selectDistrict')} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeDistricts.map((d) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('streetLabel')} error={addressErrors.street}>
                  <Input
                    type="text"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      clearAddressError('street');
                    }}
                    placeholder={t('streetPlaceholder')}
                    aria-invalid={Boolean(addressErrors.street)}
                    className={cn(FIELD_INPUT, addressErrors.street && INVALID_FIELD)}
                  />
                </Field>
                <Field label={t('houseLabel')} error={addressErrors.house}>
                  <Input
                    type="text"
                    value={house}
                    onChange={(e) => {
                      setHouse(e.target.value);
                      clearAddressError('house');
                    }}
                    placeholder={t('housePlaceholder')}
                    aria-invalid={Boolean(addressErrors.house)}
                    className={cn(FIELD_INPUT, addressErrors.house && INVALID_FIELD)}
                  />
                </Field>
              </div>

              {/* Country first, then the number: `PhoneField` groups the digits as they
                  are typed, checks the length against that country's numbering plan and,
                  for Tajik numbers, names the operator behind the prefix. */}
              <Field label={t('phoneLabel')} hint={addressErrors.contactPhone ? undefined : t('phoneHint')}>
                <PhoneField
                  value={contactPhone}
                  onChange={(next) => {
                    setContactPhone(next);
                    clearAddressError('contactPhone');
                  }}
                  error={addressErrors.contactPhone}
                />
              </Field>

              <BookingAddressMap
                point={addressPoint}
                onChange={setAddressPoint}
                cityLatitude={activeCity?.latitude}
                cityLongitude={activeCity?.longitude}
              />

              <div className="flex gap-4">
                <Button size="raw" variant="ghost"
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {t('back')}
                </Button>
                {/* Enabled on purpose. A disabled button that never explains itself is
                    the reason people abandon a checkout; pressing this one runs the
                    schema and points at what is missing. */}
                <Button size="raw" variant="ghost"
                  onClick={handleAddressContinue}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
                >
                  {t('reviewOrder')}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Summary & Confirm */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step4Heading')}</h3>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t('craftsman')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{master.displayName}</span>
                </div>
                {selectedService && (
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t('serviceWord')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedService.title}</span>
                  </div>
                )}
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{t('scheduledTime')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {date} ({formatSlotLabel(timeSlot, selectedService?.durationMinutes)})
                  </span>
                </div>
                {district && (
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t('serviceAddress')}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">
                      {district}
                      {composedAddressLine ? `, ${composedAddressLine}` : ''}
                    </span>
                  </div>
                )}
                {selectedService?.durationMinutes && (
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t('estimatedDuration')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t('hoursUnit', { count: Math.round((selectedService.durationMinutes / 60) * 10) / 10 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">{t('totalAmount')}</span>
                  <span className="font-extrabold text-blue-600 dark:text-sky-400">
                    {money(totalPrice)}
                  </span>
                </div>
              </div>

              {submitError && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">{submitError}</p>
              )}

              {/* Photos still going up? Say so, and hold the button — a booking created
                  now would reach the master without the pictures it refers to. */}
              {attachmentsUploading && (
                <p className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500">
                  <Spinner className="w-3.5 h-3.5" />
                  {t('attachmentsStillUploading')}
                </p>
              )}

              <Button size="raw" variant="unstyled"
                type="button"
                onClick={() => setShowPayment(true)}
                disabled={submitting || attachmentsUploading}
                className="btn-success w-full py-4 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed font-extrabold text-sm transition btn-ripple flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Spinner className="w-4 h-4 border-white/40 border-t-white" />
                ) : (
                  <Icon name="creditcard" size={16} />
                )}
                {t('confirmAndPay', { amount: money(totalPrice) })}
              </Button>
            </div>
          )}

        </Card>
      )}

        </div>

        {/* Running summary rail */}
        {!bookingConfirmed && (
          <aside className="lg:sticky lg:top-[88px]">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400" />
              <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative space-y-5 p-6">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                    {t('summaryTitle')}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-sky-400">
                    {t('summaryStep', { current: step, total: 4 })}
                  </p>
                </div>

                {summaryRows.length === 0 ? (
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('summaryEmpty')}</p>
                ) : (
                  <dl className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {summaryRows.map((row) => (
                      <div key={row.label} className="flex items-start justify-between gap-3">
                        <dt className="shrink-0 text-[11px] font-semibold text-slate-600 dark:text-slate-400">{row.label}</dt>
                        <dd className="text-right text-xs font-bold text-slate-900 dark:text-white">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {selectedService && (
                  <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('totalAmount')}</p>
                    <p className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {money(totalPrice)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* The booking is created by the payment sheet, not before it: nothing is sent to
          the master until the card has cleared. */}
      <PaymentDialog
        open={showPayment}
        onOpenChange={setShowPayment}
        amountLabel={money(totalPrice)}
        summary={selectedService ? `${selectedService.title} · ${master.displayName}` : undefined}
        onConfirmed={handleConfirm}
      />

    </div>
  );
}
