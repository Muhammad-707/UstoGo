'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { mastersApi, bookingsApi, citiesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { City, MasterPublic, MasterService } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/lib/placeholders';

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

function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-sky-400 animate-spin ${className}`}
    />
  );
}

export default function BookingWizardPage() {
  const t = useTranslations('booking');
  const searchParams = useSearchParams();
  const preselectedMasterId = searchParams.get('master');
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);

  const [master, setMaster] = useState<MasterPublic | null>(null);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState<string | null>(null);

  const [services, setServices] = useState<MasterService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [timeSlot, setTimeSlot] = useState<string>('');

  const [jobNotes, setJobNotes] = useState('');
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
  }, [user?.clientProfile?.cityId]);

  const activeCity = cities.find((city) => city.id === cityId) ?? null;
  const activeDistricts = activeCity?.districts ?? [];
  const composedAddressLine = [street, house].filter(Boolean).join(', ').trim();

  // Load the preselected master
  useEffect(() => {
    if (!preselectedMasterId) {
      setMasterLoading(false);
      return;
    }
    let cancelled = false;
    setMasterLoading(true);
    setMasterError(null);
    mastersApi
      .byId(preselectedMasterId)
      .then((m) => {
        if (!cancelled) setMaster(m);
      })
      .catch((err) => {
        if (!cancelled) setMasterError(err instanceof ApiError ? err.message : 'Failed to load this craftsman.');
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
    setServicesLoading(true);
    mastersApi
      .services(preselectedMasterId)
      .then((list) => {
        if (cancelled) return;
        setServices(list);
        if (list.length > 0) setSelectedServiceId((prev) => prev || list[0].id);
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
  }, [preselectedMasterId]);

  // Load availability for the selected date + service
  useEffect(() => {
    if (!preselectedMasterId || !date) return;
    let cancelled = false;
    setSlotsLoading(true);
    setTimeSlot('');
    mastersApi
      .availability(preselectedMasterId, date, date, selectedServiceId || undefined)
      .then((days) => {
        if (cancelled) return;
        const day = days.find((d) => d.date === date);
        setSlots(day?.free ?? []);
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
          ...(contactPhone.trim() ? { contactPhone: contactPhone.trim() } : {}),
        },
        note: jobNotes || undefined,
      });
      setCreatedBookingId(created.id);
      setBookingConfirmed(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // No master selected via ?master= — this wizard assumes a preselected craftsman.
  if (!preselectedMasterId) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <Icon name="Search" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">No craftsman selected</h1>
        <p className="text-sm text-slate-500">Pick a craftsman first, then come back here to book an appointment.</p>
        <Link
          href="/search"
          className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          Browse Craftsmen
        </Link>
      </div>
    );
  }

  if (masterLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (masterError || !master) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <Icon name="X" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{masterError ?? 'Craftsman not found'}</h1>
        <Link
          href="/search"
          className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          Browse Craftsmen
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

      {/* Page Title */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
          {t('instantCheckout')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('pageTitle')}
        </h1>
      </div>

      {/* Step Progress Bar */}
      {!bookingConfirmed && (
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 px-4">
          {[
            { num: 1, label: t('stepService') },
            { num: 2, label: t('stepSchedule') },
            { num: 3, label: t('stepLocation') },
            { num: 4, label: t('stepConfirmation') },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition ${
                  step === s.num
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation View Screen */}
      {bookingConfirmed ? (
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Icon name="CheckCircle2" size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('confirmedTitle')}</h2>
            <p className="text-sm text-slate-500">{t('confirmedDesc')}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl text-left text-xs space-y-3 border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">{t('master')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{master.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('scheduledDate')}</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {date} ({formatSlotLabel(timeSlot, selectedService?.durationMinutes)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('totalPrice')}</span>
              <span className="font-extrabold text-blue-600 dark:text-sky-400">
                {totalPrice.toFixed(2)} {selectedService?.currency ?? ''}
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
        </div>
      ) : (
        /* Booking Step Form Wrapper */
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">

          {/* STEP 1: Select Master & Service */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step1Heading')}</h3>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('chosenCraftsman')}</label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img
                    src={getAvatarUrl(master.id)}
                    alt={master.displayName}
                    className="w-14 h-14 rounded-2xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{master.displayName}</h4>
                    <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">
                      {master.categories?.join(', ')}
                    </p>
                    {master.priceFrom && (
                      <span className="text-xs text-slate-500 font-bold">From ${master.priceFrom}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select a Service</label>
                {servicesLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    This craftsman has no bookable services yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setSelectedServiceId(svc.id)}
                        className={`p-3.5 rounded-2xl text-left text-xs font-bold border transition ${
                          selectedServiceId === svc.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div>{svc.title}</div>
                        <div className={selectedServiceId === svc.id ? 'text-blue-100' : 'text-slate-400'}>
                          {svc.price} {svc.currency}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('jobDescription')}</label>
                <textarea
                  rows={3}
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  placeholder={t('jobDescriptionPlaceholder')}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!selectedServiceId}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition btn-ripple"
              >
                {t('continueToSchedule')}
              </button>
            </div>
          )}

          {/* STEP 2: Schedule Date & Time */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step2Heading')}</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('appointmentDate')}</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('availableTimeSlots')}</label>
                {slotsLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner />
                  </div>
                ) : slots.length === 0 && busySlots.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    No availability on this date — try another day.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setTimeSlot(slot)}
                        className={`p-3.5 rounded-2xl text-xs font-bold border transition ${
                          timeSlot === slot
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {formatSlotLabel(slot, selectedService?.durationMinutes)}
                      </button>
                    ))}
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
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {t('back')}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!timeSlot}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition btn-ripple"
                >
                  {t('continueToAddress')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Address */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step3Heading')}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('cityLabel')}</label>
                  <select
                    value={cityId}
                    onChange={(e) => {
                      setCityId(e.target.value);
                      setDistrict('');
                    }}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">{t('selectCity')}</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('districtLabel')}</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={!activeCity}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none disabled:opacity-50"
                  >
                    <option value="">{t('selectDistrict')}</option>
                    {activeDistricts.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('streetLabel')}</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder={t('streetPlaceholder')}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t('houseLabel')} <span className="text-slate-400 normal-case">{t('optional')}</span>
                  </label>
                  <input
                    type="text"
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    placeholder={t('housePlaceholder')}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('phoneLabel')}</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={user?.phone ?? '+992 __ ___-__-__'}
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                <p className="text-[10px] text-slate-400">{t('phoneHint')}</p>
              </div>

              <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500 font-bold border border-slate-300 dark:border-slate-700">
                {t('mapPlaceholder')}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {t('back')}
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!district || !street.trim()}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition btn-ripple"
                >
                  {t('reviewOrder')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Summary & Confirm */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step4Heading')}</h3>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">{t('craftsman')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{master.displayName}</span>
                </div>
                {selectedService && (
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Service</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedService.title}</span>
                  </div>
                )}
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">{t('scheduledTime')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {date} ({formatSlotLabel(timeSlot, selectedService?.durationMinutes)})
                  </span>
                </div>
                {district && (
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">{t('serviceAddress')}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">
                      {district}
                      {composedAddressLine ? `, ${composedAddressLine}` : ''}
                    </span>
                  </div>
                )}
                {selectedService?.durationMinutes && (
                  <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">{t('estimatedDuration')}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t('hoursUnit', { count: Math.round((selectedService.durationMinutes / 60) * 10) / 10 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">{t('totalAmount')}</span>
                  <span className="font-extrabold text-blue-600 dark:text-sky-400">
                    {totalPrice.toFixed(2)} {selectedService?.currency ?? ''}
                  </span>
                </div>
              </div>

              {submitError && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">{submitError}</p>
              )}

              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-sm shadow-xl transition btn-ripple flex items-center justify-center gap-2"
              >
                {submitting && <Spinner className="w-4 h-4 border-white/40 border-t-white" />}
                {t('confirmAndPay', { amount: totalPrice.toFixed(2) })}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
