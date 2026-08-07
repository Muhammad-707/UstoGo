'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { bookingsApi, citiesApi, reviewsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { downloadFile } from '@/lib/api/download';
import { waLink, waBookingText } from '@/lib/whatsapp';
import { getBookingsSocket } from '@/lib/bookings/socket';
import type { BookingDetail, City } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/lib/placeholders';

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

function Spinner() {
  return (
    <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-sky-400 animate-spin" />
  );
}

export default function BookingDetailsPage() {
  const t = useTranslations('bookingDetail');
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
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [alreadyClientRated, setAlreadyClientRated] = useState(false);

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
        setError(err instanceof ApiError ? err.message : 'Failed to load booking.');
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

  useEffect(() => {
    if (!booking || user?.role !== 'MASTER' || booking.status !== 'COMPLETED') return;
    reviewsApi
      .received()
      .then((res) => setAlreadyClientRated(res.items.some((r) => r.bookingId === booking.id && r.clientRating != null)))
      .catch(() => setAlreadyClientRated(false));
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
        setActionError(err instanceof ApiError ? err.message : 'Action failed. Please try again.');
      }
    } finally {
      setActionPending(false);
    }
  };

  const handleCancel = () => {
    const reason = window.prompt('Reason for cancellation (optional):') ?? undefined;
    runAction(() => bookingsApi.cancel(bookingId, reason || undefined));
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
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <Icon name="Search" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Booking not found</h1>
        <p className="text-sm text-slate-500">This booking doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link
          href="/dashboard/client"
          className="inline-block px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <Icon name="X" size={28} />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{error ?? 'Something went wrong'}</h1>
      </div>
    );
  }

  const scheduled = new Date(booking.scheduledAt);
  const scheduledDate = scheduled.toLocaleDateString();
  const scheduledTime = scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const timeline = [
    { label: 'Booking Request Placed', completed: true, timestamp: booking.createdAt },
    { label: 'Craftsman Confirmed', completed: !!booking.acceptedAt, timestamp: booking.acceptedAt },
    { label: 'Work in Progress', completed: !!booking.startedAt, timestamp: booking.startedAt },
    { label: 'Job Completed & Verified', completed: !!booking.completedAt, timestamp: booking.completedAt },
  ];

  const isClient = user?.role === 'CLIENT';
  const isMaster = user?.role === 'MASTER';
  const canClientCancel = isClient && ['PENDING', 'ACCEPTED'].includes(booking.status);
  const canMasterAccept = isMaster && booking.status === 'PENDING';
  const canMasterReject = isMaster && booking.status === 'PENDING';
  // eslint-disable-next-line react-hooks/purity -- one-off UI gate; the backend re-validates the schedule on accept
  const canMasterStart = isMaster && booking.status === 'ACCEPTED' && new Date(booking.scheduledAt).getTime() <= Date.now();
  const canMasterComplete = isMaster && booking.status === 'IN_PROGRESS';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-mono font-extrabold">
              {booking.bookingNumber}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE_CLASS[booking.status] ?? 'bg-slate-100 text-slate-700'}`}>
              {tc(STATUS_KEY[booking.status] ?? 'statusPending')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {booking.serviceTitle}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t('scheduledFor', { date: scheduledDate, time: scheduledTime })}</p>
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

          {isMaster && booking.status === 'COMPLETED' && !alreadyClientRated && (
            <Link
              href={`/reviews?booking=${booking.id}`}
              className="btn-success px-5 py-3 rounded-2xl font-extrabold text-xs transition flex items-center gap-2"
            >
              <Icon name="Star" size={16} />
              <span>{t('rateClient')}</span>
            </Link>
          )}

          {(isClient || isMaster) && booking.status === 'COMPLETED' && (
            <button
              onClick={handleDownloadReceipt}
              disabled={downloadingReceipt}
              className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-2 disabled:opacity-60"
            >
              <Icon name="filetext" size={16} />
              <span>{downloadingReceipt ? t('downloadingReceipt') : t('downloadReceipt')}</span>
            </button>
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

          {canClientCancel && (
            <button
              onClick={handleCancel}
              disabled={actionPending}
              className="px-5 py-3 rounded-2xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-extrabold text-xs hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50"
            >
              Cancel Booking
            </button>
          )}

          {canMasterAccept && (
            <button
              onClick={() => runAction(() => bookingsApi.accept(booking.id))}
              disabled={actionPending}
              className="btn-success px-5 py-3 rounded-2xl font-extrabold text-xs transition disabled:opacity-50"
            >
              Accept
            </button>
          )}
          {canMasterReject && (
            <button
              onClick={() => {
                const reason = window.prompt('Reason for rejection:') ?? '';
                if (reason) runAction(() => bookingsApi.reject(booking.id, reason));
              }}
              disabled={actionPending}
              className="px-5 py-3 rounded-2xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-extrabold text-xs hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50"
            >
              Reject
            </button>
          )}
          {canMasterStart && (
            <button
              onClick={() => runAction(() => bookingsApi.start(booking.id))}
              disabled={actionPending}
              className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
            >
              Start Job
            </button>
          )}
          {canMasterComplete && (
            <button
              onClick={() => runAction(() => bookingsApi.complete(booking.id))}
              disabled={actionPending}
              className="btn-success px-5 py-3 rounded-2xl font-extrabold text-xs transition disabled:opacity-50"
            >
              Mark Completed
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">{actionError}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Timeline Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Stage Progress Timeline */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="Clock" size={20} className="text-blue-600 dark:text-sky-400" />
              {t('liveTimeline')}
            </h3>

            {booking.cancelledAt ? (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 space-y-1">
                <h4 className="text-sm font-bold text-red-700 dark:text-red-300">Booking Cancelled</h4>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {new Date(booking.cancelledAt).toLocaleString()}
                  {booking.cancellationReason ? ` — ${booking.cancellationReason}` : ''}
                </p>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
                {timeline.map((item, idx) => {
                  const isCurrent = item.completed && (idx === timeline.length - 1 || !timeline[idx + 1].completed);
                  return (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                        item.completed
                          ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950'
                          : 'bg-slate-300 dark:bg-slate-700'
                      } ${isCurrent ? 'animate-pulse' : ''}`}
                    />
                    <div>
                      <h4
                        className={`text-sm font-bold ${
                          item.completed
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {item.label}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Master Info Card */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-lg">
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
          </div>

        </div>

        {/* Receipt Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">{t('paymentAndAddress')}</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('serviceFee')}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {booking.price} {booking.currency}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">{t('totalPaid')}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {booking.price} {booking.currency}
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
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
