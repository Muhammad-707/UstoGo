'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BadgeCheck, CircleCheckBig, FileText, Hammer } from 'lucide-react';
import { Icon } from '@/components/icons/LucideIcons';
import { Skeleton } from '@/components/ui/skeleton';
import { bookingsApi, citiesApi, mastersApi, reviewsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { downloadFile } from '@/lib/api/download';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { ReportUserButton } from '@/components/reports/ReportUserButton';

const LiveTrackingMap = dynamic(() => import('@/components/booking/LiveTrackingMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-3xl" />,
});
import { waLink, waBookingText } from '@/lib/whatsapp';
import { getBookingsSocket } from '@/lib/bookings/socket';
import { CANCELLATION_REASON_CODES, type BookingDetail, type CancellationReasonCode, type City, type CompletionCertificate } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/lib/placeholders';
import { useMoney } from '@/lib/money';
import { useDateFormat } from '@/lib/datetime';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { DatePicker, todayISO } from '@/components/ui/date-picker';

const STATUS_KEY: Record<string, string> = {
  PENDING: 'statusPending',
  ACCEPTED: 'statusConfirmed',
  IN_PROGRESS: 'statusInProgress',
  COMPLETED: 'statusCompleted',
  REJECTED: 'statusCancelled',
  EXPIRED: 'statusCancelled',
  CANCELLED_BY_CLIENT: 'statusCancelled',
  CANCELLED_BY_MASTER: 'statusCancelled',
  CANCELLED_BY_ADMIN: 'statusCancelled',
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ACCEPTED: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  EXPIRED: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  CANCELLED_BY_CLIENT: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  CANCELLED_BY_MASTER: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  CANCELLED_BY_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

/** One glyph per stage, in the order the stages happen. */
const TIMELINE_ICONS = [FileText, BadgeCheck, Hammer, CircleCheckBig];

export default function BookingDetailsPage() {
  const t = useTranslations('bookingDetail');
  const fmt = useDateFormat();
  const { money } = useMoney();
  const tc = useTranslations('common');
  const { user } = useAuth();
  const params = useParams();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonCode, setCancelReasonCode] = useState<CancellationReasonCode | ''>('');
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<{ fileId: string; url: string }[]>([]);
  const [certificate, setCertificate] = useState<CompletionCertificate | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [masterLiveLocation, setMasterLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const lastEmitRef = useRef(0);

  const handleViewCertificate = async () => {
    setShowCertificateModal(true);
    if (certificate) return;
    setCertificateLoading(true);
    try {
      setCertificate(await bookingsApi.certificate(bookingId));
    } catch {
      // ignore — modal shows a loading state indefinitely if this fails, acceptable for a best-effort view
    } finally {
      setCertificateLoading(false);
    }
  };

  useEffect(() => {
    if (!booking || booking.attachmentFileIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale URLs when a booking has no (or no longer resolved) attachments
      setAttachmentUrls([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      booking.attachmentFileIds.map((fileId) =>
        bookingsApi
          .attachmentUrl(booking.id, fileId)
          .then((res) => ({ fileId, url: res.url }))
          .catch(() => null),
      ),
    ).then((results) => {
      if (!cancelled) setAttachmentUrls(results.filter((r): r is { fileId: string; url: string } => r !== null));
    });
    return () => {
      cancelled = true;
    };
  }, [booking?.id, booking?.attachmentFileIds]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    citiesApi.list().then((list) => setCities(list)).catch(() => setCities([]));
  }, []);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const b = await bookingsApi.byId(bookingId);
      setBooking(b);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof ApiError ? err.message : t('loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the booking on mount/id change
    load();
  }, [load]);

  useEffect(() => {
    if (!booking || user?.role !== 'CLIENT' || booking.status !== 'COMPLETED') return;
    reviewsApi
      .myReviews()
      .then((res) => setAlreadyReviewed(res.items.some((r) => r.bookingId === booking.id)))
      .catch(() => {});
  }, [booking, user?.role]);

  // Live status without a manual refresh: WebSocket push (BookingsGateway) is the
  // primary channel, with polling as a fallback while the socket reconnects or if
  // it's unavailable. Terminal states stop both — nothing left to change.
  const TERMINAL_STATUSES = new Set([
    'COMPLETED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED_BY_CLIENT',
    'CANCELLED_BY_MASTER',
    'CANCELLED_BY_ADMIN',
  ]);
  useEffect(() => {
    if (!bookingId || !booking || TERMINAL_STATUSES.has(booking.status)) return;
    const interval = setInterval(() => {
      bookingsApi.byId(bookingId).then(setBooking).catch(() => {});
    }, 20_000);
    return () => clearInterval(interval);
  }, [bookingId, booking?.status]);

  useEffect(() => {
    if (!bookingId) return;
    const socket = getBookingsSocket();
    const onUpdate = (payload: { bookingId: string; status: string }) => {
      if (payload.bookingId === bookingId) {
        bookingsApi.byId(bookingId).then(setBooking).catch(() => {});
      }
    };
    socket?.on('booking:update', onUpdate);
    return () => {
      socket?.off('booking:update', onUpdate);
    };
  }, [bookingId]);

  // Master side: while the job is IN_PROGRESS, relay the device's position over the
  // socket ("on my way" tracking) — throttled, since watchPosition can fire far more
  // often than the relay needs.
  useEffect(() => {
    if (!bookingId || user?.role !== 'MASTER' || booking?.status !== 'IN_PROGRESS') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const socket = getBookingsSocket();
    const LOCATION_EMIT_INTERVAL_MS = 10_000;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastEmitRef.current < LOCATION_EMIT_INTERVAL_MS) return;
        lastEmitRef.current = now;
        socket?.emit('location:update', {
          bookingId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Permission denied or unavailable — "on my way" tracking is best-effort,
        // never blocks the rest of the booking flow.
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 15_000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [bookingId, user?.role, booking?.status]);

  // Client side: while the job is IN_PROGRESS, listen for the master's relayed position.
  useEffect(() => {
    if (!bookingId || user?.role !== 'CLIENT' || booking?.status !== 'IN_PROGRESS') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears a stale marker once the job leaves IN_PROGRESS
      setMasterLiveLocation(null);
      return;
    }
    const socket = getBookingsSocket();
    const onLocation = (payload: { bookingId: string; lat: number; lng: number }) => {
      if (payload.bookingId === bookingId) {
        setMasterLiveLocation({ lat: payload.lat, lng: payload.lng });
      }
    };
    socket?.on('location:update', onLocation);
    return () => {
      socket?.off('location:update', onLocation);
    };
  }, [bookingId, user?.role, booking?.status]);

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionPending(true);
    setActionError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      if (err instanceof ApiError && (err.code === 'TOO_EARLY_TO_START' || err.status === 422)) {
        setActionError(t('startJobTooEarly'));
      } else {
        setActionError(err instanceof ApiError ? err.message : t('actionFailed'));
      }
    } finally {
      setActionPending(false);
    }
  };

  const handleCancel = () => {
    setCancelReasonCode('');
    setCancelReasonText('');
    setShowCancelModal(true);
  };

  const handleOpenReschedule = () => {
    setRescheduleDate('');
    setRescheduleSlots([]);
    setSelectedRescheduleSlot('');
    setRescheduleError(null);
    setShowRescheduleModal(true);
  };

  useEffect(() => {
    if (!showRescheduleModal || !rescheduleDate || !booking) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets slot selection/loading before an async fetch
    setRescheduleSlotsLoading(true);
    setSelectedRescheduleSlot('');
    mastersApi
      .availability(booking.masterId, rescheduleDate, rescheduleDate, booking.serviceId)
      .then((days) => {
        if (cancelled) return;
        const day = days.find((d) => d.date === rescheduleDate);
        setRescheduleSlots(day?.free ?? []);
      })
      .catch(() => {
        if (!cancelled) setRescheduleSlots([]);
      })
      .finally(() => {
        if (!cancelled) setRescheduleSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showRescheduleModal, rescheduleDate, booking]);

  const confirmReschedule = async () => {
    if (!selectedRescheduleSlot) return;
    setRescheduling(true);
    setRescheduleError(null);
    try {
      const updated = await bookingsApi.reschedule(bookingId, selectedRescheduleSlot);
      setBooking((prev) => (prev ? { ...prev, ...updated } : prev));
      setShowRescheduleModal(false);
    } catch (err) {
      setRescheduleError(err instanceof ApiError ? err.message : t('rescheduleFailed'));
    } finally {
      setRescheduling(false);
    }
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    runAction(() =>
      bookingsApi.cancel(
        bookingId,
        cancelReasonText.trim() || undefined,
        cancelReasonCode || undefined,
      ),
    );
  };

  const openPaymentModal = () => {
    setPaidAmount(booking?.price ?? '');
    setPaymentNote('');
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!booking) return;
    const amount = Number(paidAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setPaymentError(t('paymentAmountInvalid'));
      return;
    }
    // The backend enforces this too (PAYMENT_NOTE_REQUIRED); checking here saves a
    // round trip and puts the message next to the field that caused it.
    if (amount < Number(booking.price) && paymentNote.trim().length < 10) {
      setPaymentError(t('paymentNoteRequired'));
      return;
    }
    setConfirmingPayment(true);
    setPaymentError(null);
    try {
      const updated = await bookingsApi.confirmPayment(booking.id, amount, paymentNote.trim() || undefined);
      setBooking((prev) => (prev ? { ...prev, ...updated } : prev));
      setShowPaymentModal(false);
    } catch (err) {
      setPaymentError(err instanceof ApiError ? err.message : t('paymentConfirmFailed'));
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setDownloadingReceipt(true);
    try {
      await downloadFile(`/bookings/${bookingId}/receipt.pdf`, `ustogo-receipt-${bookingId}.pdf`);
    } catch {
      // best-effort — no toast system wired up here yet
    } finally {
      setDownloadingReceipt(false);
    }
  };

  if (loading) {
    /* Shaped like the page it replaces — header band, timeline column, sidebar — so
       nothing jumps when the booking lands. */
    return (
      <div className="page-shell space-y-8 py-12">
        <Skeleton className="h-40 w-full rounded-[2rem]" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-52 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page-shell page-shell-narrow py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <Icon name="Search" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('notFoundTitle')}</h1>
        <p className="text-sm text-slate-500">{t('notFoundDesc')}</p>
        <Link
          href="/dashboard/client"
          className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          {t('backToDashboard')}
        </Link>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="page-shell page-shell-narrow py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <Icon name="X" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{error ?? t('genericError')}</h1>
      </div>
    );
  }

  const scheduled = new Date(booking.scheduledAt);
  const scheduledDate = scheduled.toLocaleDateString();
  const scheduledTime = scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const timeline = [
    { label: t('timelinePlaced'), completed: true, timestamp: booking.createdAt },
    { label: t('timelineConfirmed'), completed: !!booking.acceptedAt, timestamp: booking.acceptedAt },
    { label: t('timelineInProgress'), completed: !!booking.startedAt, timestamp: booking.startedAt },
    { label: t('timelineCompleted'), completed: !!booking.completedAt, timestamp: booking.completedAt },
  ];

  const isClient = user?.role === 'CLIENT';
  const isMaster = user?.role === 'MASTER';
  const canClientCancel = isClient && ['PENDING', 'ACCEPTED'].includes(booking.status);
  const canClientReschedule =
    isClient && ['PENDING', 'ACCEPTED'].includes(booking.status) && booking.rescheduleCount === 0;
  const canMasterAccept = isMaster && booking.status === 'PENDING';
  const canMasterReject = isMaster && booking.status === 'PENDING';
  // eslint-disable-next-line react-hooks/purity -- one-off UI gate; the backend re-validates the schedule on accept
  const canMasterStart = isMaster && booking.status === 'ACCEPTED' && new Date(booking.scheduledAt).getTime() <= Date.now();
  const canMasterComplete = isMaster && booking.status === 'IN_PROGRESS';

  const doneSteps = timeline.filter((s) => s.completed).length;
  const cancelled = !!booking.cancelledAt;

  return (
    <div className="page-shell py-12 space-y-8">

      {/* Header */}
      <Card className="overflow-hidden rounded-[2rem] border border-slate-200 p-0 shadow-xl dark:border-slate-800">
        <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 font-mono text-xs font-extrabold text-blue-700 dark:bg-blue-950 dark:text-sky-300">
                {booking.bookingNumber}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE_CLASS[booking.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {tc(STATUS_KEY[booking.status] ?? 'statusPending')}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {booking.serviceTitle}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Icon name="calendar" size={13} />
              {t('scheduledFor', { date: scheduledDate, time: scheduledTime })}
            </p>
          </div>

        <div className="flex flex-wrap items-center gap-3">
          {isClient && booking.status === 'COMPLETED' && !alreadyReviewed && (
            <Link
              href={`/reviews?booking=${booking.id}`}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/30 transition flex items-center gap-2"
            >
              <Icon name="Star" size={16} />
              <span>{t('leaveReview')}</span>
            </Link>
          )}

          {isClient && booking.status === 'COMPLETED' && (
            <Link
              href={`/booking?master=${booking.masterId}&service=${booking.serviceId}`}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
            >
              <Icon name="Calendar" size={16} />
              <span>{t('bookAgain')}</span>
            </Link>
          )}

          {(isClient || isMaster) && booking.status === 'COMPLETED' && (
            <Button size="raw" variant="ghost"
              onClick={handleDownloadReceipt}
              disabled={downloadingReceipt}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-60"
            >
              <Icon name="filetext" size={16} />
              <span>{downloadingReceipt ? t('downloadingReceipt') : t('downloadReceipt')}</span>
            </Button>
          )}

          {(isClient || isMaster) && booking.status === 'COMPLETED' && (
            <Button size="raw" variant="ghost"
              onClick={handleViewCertificate}
              className="px-5 py-3 rounded-2xl border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 font-extrabold text-xs hover:bg-amber-50 dark:hover:bg-amber-950/40 transition flex items-center gap-2"
            >
              <Icon name="shieldcheck" size={16} />
              <span>{t('viewCertificate')}</span>
            </Button>
          )}

          {booking.masterWhatsappPhone && ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status) && (() => {
            const link = waLink(booking.masterWhatsappPhone, waBookingText(booking.serviceTitle, booking.bookingNumber));
            return link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-success px-5 py-3 rounded-2xl font-extrabold text-xs transition flex items-center gap-2"
                onClick={() => { bookingsApi.whatsappClick(booking.id).catch(() => {}); }}
              >
                <Icon name="whatsapp" size={16} />
                <span>{t('writeToWhatsApp')}</span>
              </a>
            ) : null;
          })()}

          {canClientReschedule && (
            <Button size="raw" variant="ghost"
              onClick={handleOpenReschedule}
              disabled={actionPending}
              className="px-5 py-3 rounded-2xl border border-blue-200 dark:border-sky-900 text-blue-600 dark:text-sky-400 font-extrabold text-xs hover:bg-blue-50 dark:hover:bg-sky-950/40 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Icon name="calendar" size={16} />
              {t('rescheduleButton')}
            </Button>
          )}

          {canClientCancel && (
            <Button size="raw" variant="ghost"
              onClick={handleCancel}
              disabled={actionPending}
              className="px-5 py-3 rounded-2xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-extrabold text-xs hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50"
            >
              {t('cancelBooking')}
            </Button>
          )}

          {canMasterAccept && (
            <Button size="raw" variant="ghost"
              onClick={() => runAction(() => bookingsApi.accept(booking.id))}
              disabled={actionPending}
              className="btn-success px-5 py-3 rounded-2xl font-extrabold text-xs transition disabled:opacity-50"
            >
              {t('accept')}
            </Button>
          )}
          {canMasterReject && (
            <Button size="raw" variant="ghost"
              onClick={() => {
                const reason = window.prompt('Reason for rejection:') ?? '';
                if (reason) runAction(() => bookingsApi.reject(booking.id, reason));
              }}
              disabled={actionPending}
              className="px-5 py-3 rounded-2xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-extrabold text-xs hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50"
            >
              {t('reject')}
            </Button>
          )}
          {canMasterStart && (
            <Button size="raw" variant="ghost"
              onClick={() => runAction(() => bookingsApi.start(booking.id))}
              disabled={actionPending}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
            >
              {t('startJob')}
            </Button>
          )}
          {canMasterComplete && (
            <Button size="raw" variant="ghost"
              onClick={() => runAction(() => bookingsApi.complete(booking.id))}
              disabled={actionPending}
              className="btn-success px-5 py-3 rounded-2xl font-extrabold text-xs transition disabled:opacity-50"
            >
              {t('markCompleted')}
            </Button>
          )}
        </div>
        </div>

        {/* Progress rail — the four stages as one bar. The timeline lower down has the
            timestamps; this says "where are we" without scrolling to find out. */}
        {!cancelled && (
          <div className="border-t border-slate-100 px-6 py-5 sm:px-8 dark:border-slate-800">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('progressLabel')}
              </span>
              <span className="text-[11px] font-bold text-slate-500 tabular-nums dark:text-slate-400">
                {t('stepOfTotal', { done: doneSteps, total: timeline.length })}
              </span>
            </div>
            <div className="flex gap-1.5">
              {timeline.map((s, idx) => (
                <div
                  key={idx}
                  title={s.label}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                    s.completed
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Reporting the counterparty needs their *user* id, which only the two
          participants of a booking ever see — this is the one place it is available. */}
      {(isClient || isMaster) && (
        <div className="flex justify-end -mt-4">
          {isClient && booking.masterUserId && (
            <ReportUserButton reportedUserId={booking.masterUserId} />
          )}
          {isMaster && booking.clientUserId && (
            <ReportUserButton reportedUserId={booking.clientUserId} />
          )}
        </div>
      )}

      {actionError && (
        <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">{actionError}</p>
      )}

      {/* Payment confirmation (FR-7.7) — records a cash/transfer that already happened
          off-platform (ADR-8), so it exists only once the job itself is COMPLETED. */}
      {booking.status === 'COMPLETED' && (isClient || isMaster) && (() => {
        const confirmed = !!booking.paymentConfirmedAt;
        const paid = Number(booking.paidAmount ?? 0);
        const agreed = Number(booking.price);
        const tip = confirmed && paid > agreed ? (paid - agreed).toFixed(2) : null;
        const short = confirmed && paid < agreed ? (agreed - paid).toFixed(2) : null;

        return (
          <Card
            className={`p-6 sm:p-7 rounded-3xl border shadow-xl ${
              confirmed
                ? 'border-emerald-200 dark:border-emerald-900/60'
                : 'border-amber-200 dark:border-amber-900/60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${
                    confirmed
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <Icon name={confirmed ? 'checkcircle2' : 'dollarsign'} size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {confirmed ? t('paymentConfirmedTitle') : t('paymentPendingTitle')}
                  </h3>
                  {confirmed ? (
                    <>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('paymentConfirmedOn', { date: fmt.dateTime(booking.paymentConfirmedAt as string) })}
                      </p>
                      {booking.paymentNote && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                          <span className="font-bold text-slate-400">{t('paymentNoteLabel')}:</span> {booking.paymentNote}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                      {isClient ? t('paymentPendingHintClient') : t('paymentPendingHintMaster')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {confirmed ? t('paymentPaidLabel') : t('paymentAgreedLabel')}
                  </span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {money(confirmed ? booking.paidAmount : booking.price)}
                  </span>
                  {tip && (
                    <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {t('paymentTip', { amount: money(tip) })}
                    </span>
                  )}
                  {short && (
                    <span className="block text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {t('paymentShort', { amount: money(short) })}
                    </span>
                  )}
                </div>

                {!confirmed && isClient && (
                  <Button size="raw" variant="ghost"
                    onClick={openPaymentModal}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
                  >
                    <Icon name="checkcircle2" size={16} />
                    {t('confirmPaymentButton')}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Timeline Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Stage Progress Timeline */}
          <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="Clock" size={20} className="text-blue-600 dark:text-sky-400" />
              {t('liveTimeline')}
            </h3>

            {booking.cancelledAt ? (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-1">
                <h4 className="text-sm font-bold text-red-700 dark:text-red-300">{t('cancelledTitle')}</h4>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {fmt.dateTime(booking.cancelledAt)}
                  {booking.cancellationReason ? ` — ${booking.cancellationReason}` : ''}
                </p>
              </div>
            ) : (
              /* The rail is drawn per-step rather than as one long border: a single
                 border-left is grey for its whole height, so a booking three quarters
                 done looked exactly like one that had just been placed. */
              <ol className="space-y-0">
                {timeline.map((item, idx) => {
                  const isCurrent = item.completed && (idx === timeline.length - 1 || !timeline[idx + 1].completed);
                  const isLast = idx === timeline.length - 1;
                  const StepIcon = TIMELINE_ICONS[idx] ?? CircleCheckBig;
                  return (
                    <li key={idx} className="relative flex gap-4 pb-8 last:pb-0">
                      {/* Connector to the next step */}
                      {!isLast && (
                        <span
                          aria-hidden
                          className={`absolute left-[17px] top-9 bottom-0 w-0.5 rounded-full transition-colors duration-500 ${
                            timeline[idx + 1].completed ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      )}

                      <span
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                          item.completed
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
                        )}
                        <StepIcon size={16} strokeWidth={2.4} className="relative" />
                      </span>

                      <div className="min-w-0 pt-1.5">
                        <h4
                          className={`text-sm font-bold ${
                            item.completed ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.label}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.timestamp ? fmt.dateTime(item.timestamp) : '—'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          {/* Live "On My Way" Tracking */}
          {isClient && booking.status === 'IN_PROGRESS' && masterLiveLocation && (
            <Card className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Icon name="mappin" size={20} className="text-blue-600 dark:text-sky-400" />
                {t('liveTrackingTitle')}
              </h3>
              <LiveTrackingMap
                masterLocation={masterLiveLocation}
                destination={
                  booking.latitude != null && booking.longitude != null
                    ? { lat: booking.latitude, lng: booking.longitude }
                    : null
                }
              />
            </Card>
          )}

          {/* Master Info Card */}
          <Card className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <img src={getAvatarUrl(booking.masterId, booking.masterDisplayName)} alt={booking.masterDisplayName} className="w-14 h-14 rounded-2xl object-cover" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{booking.masterDisplayName}</h4>
                <p className="text-xs text-slate-500">{booking.serviceTitle}</p>
              </div>
            </div>
            <Link
              href={`/master/${booking.masterId}`}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('profile')}
            </Link>
          </Card>

        </div>

        {/* Receipt Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{t('paymentAndAddress')}</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('serviceFee')}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {money(booking.price)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">{t('totalPaid')}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {money(booking.price)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">{t('serviceAddress')}</span>
              {booking.cityId && (
                <p className="text-slate-900 dark:text-white font-semibold">
                  {cities.find((c) => c.id === booking.cityId)?.name ?? ''}
                  {booking.addressDistrict ? `, ${booking.addressDistrict}` : ''}
                </p>
              )}
              <p className="text-slate-500">{booking.addressLine || '—'}</p>
              {booking.contactPhone && (
                <p className="pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <Icon name="Phone" size={12} className="inline mr-1" />
                  {booking.contactPhone}
                </p>
              )}
              {booking.clientNote && (
                <p className="pt-2 text-slate-600 dark:text-slate-300 italic">{booking.clientNote}</p>
              )}
              {attachmentUrls.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {attachmentUrls.map(({ fileId, url }) => (
                    <a
                      key={fileId}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not worth Next/Image optimization */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

      <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
        <DialogContent showCloseButton={false} className="bg-transparent dark:bg-transparent border-0 shadow-none p-0 gap-4">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('certificateTitle')}</DialogTitle>
          </DialogHeader>
          {certificateLoading || !certificate ? (
            <Card className="rounded-3xl p-12 text-center">
              <Skeleton className="h-40 w-full rounded-2xl" />
            </Card>
          ) : (
            <CertificateCard certificate={certificate} />
          )}
          <DialogClose asChild>
            <Button
              variant="outline"
              className="w-full h-auto px-5 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('cancelModalDismiss')}
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="gap-4">
            <DialogHeader>
              <DialogTitle>{t('rescheduleModalTitle')}</DialogTitle>
              <DialogDescription>{t('rescheduleModalHint')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date">{t('rescheduleDateLabel')}</Label>
              <DatePicker
                id="reschedule-date"
                value={rescheduleDate}
                min={todayISO()}
                onChange={setRescheduleDate}
                className="p-3 rounded-xl"
              />
            </div>

            {rescheduleDate && (
              <div className="space-y-1.5">
                <Label>{t('rescheduleSlotLabel')}</Label>
                {rescheduleSlotsLoading ? (
                  <p className="text-xs text-slate-400">{t('loadingSlots')}</p>
                ) : rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-slate-400">{t('noSlotsAvailable')}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rescheduleSlots.map((slot) => (
                      <Button size="raw" variant="ghost"
                        key={slot}
                        onClick={() => setSelectedRescheduleSlot(slot)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                          selectedRescheduleSlot === slot
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-sky-700'
                        }`}
                      >
                        {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {rescheduleError && <p className="text-xs font-bold text-red-600 dark:text-red-400">{rescheduleError}</p>}

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-auto px-5 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('cancelModalDismiss')}
                </Button>
              </DialogClose>
              <Button
                variant="brand"
                onClick={confirmReschedule}
                disabled={!selectedRescheduleSlot || rescheduling}
                className="h-auto px-5 py-2.5 rounded-xl text-xs shadow"
              >
                {rescheduling ? t('rescheduling') : t('rescheduleModalConfirm')}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="gap-4">
            <DialogHeader>
              <DialogTitle>{t('cancelModalTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason">{t('cancelReasonLabel')}</Label>
              <Select
                value={cancelReasonCode || undefined}
                onValueChange={(value) => setCancelReasonCode(value as CancellationReasonCode)}
              >
                <SelectTrigger id="cancel-reason" className="p-3 rounded-xl">
                  <SelectValue placeholder={t('cancelReasonPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CANCELLATION_REASON_CODES.map((code) => (
                    <SelectItem key={code} value={code}>{t(`cancelReasonCode.${code}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cancel-details">{t('cancelDetailsLabel')}</Label>
              <Textarea
                id="cancel-details"
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                rows={3}
                maxLength={500}
                className="p-3 rounded-xl font-semibold"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-auto px-5 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t('cancelModalDismiss')}
                </Button>
              </DialogClose>
              <Button
                variant="brand"
                onClick={confirmCancel}
                disabled={actionPending}
                className="h-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 shadow-red-600/25 text-xs shadow"
              >
                {t('cancelModalConfirm')}
              </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm payment modal (FR-7.7) */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="gap-5">
          <DialogHeader className="flex-row items-start gap-3 space-y-0">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Icon name="dollarsign" size={18} />
            </div>
            <div className="space-y-0.5">
              <DialogTitle>{t('paymentModalTitle')}</DialogTitle>
              <DialogDescription>{t('paymentModalSubtitle')}</DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500">{t('paymentAgreedLabel')}</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              {money(booking.price)}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">{t('paymentAmountLabel')}</Label>
            <div className="relative">
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="p-3.5 pr-16 rounded-xl text-sm font-extrabold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {booking.currency}
              </span>
            </div>
            <Button
              type="button"
              variant="link"
              onClick={() => setPaidAmount(booking.price)}
              className="h-auto p-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
            >
              {t('paymentPaidInFull')}
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-note">
              {t('paymentNoteLabel')}
              {Number(paidAmount) < Number(booking.price) && (
                <span className="text-red-500"> *</span>
              )}
            </Label>
            <Textarea
              id="payment-note"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t('paymentNotePlaceholder')}
              className="p-3 rounded-xl font-semibold"
            />
          </div>

          {paymentError && (
            <p className="text-xs font-bold text-red-600 dark:text-red-400">{paymentError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="h-auto px-5 py-2.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('cancelModalDismiss')}
              </Button>
            </DialogClose>
            <Button
              onClick={confirmPayment}
              disabled={confirmingPayment}
              className="h-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25"
            >
              {confirmingPayment ? '...' : t('confirmPaymentButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
