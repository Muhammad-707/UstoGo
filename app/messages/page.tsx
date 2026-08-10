'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { bookingsApi, masterCabinetApi } from '@/lib/api/endpoints';
import { Icon } from '@/components/icons/LucideIcons';
import type { Booking, QuickReply, UserRole } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/lib/placeholders';
import { waLink, waBookingText } from '@/lib/whatsapp';
import { EmptyState } from '@/components/ui/EmptyState';

const WHATSAPP_STATUSES = new Set(['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']);

function WhatsAppContactCard({
  booking,
  role,
  quickReplies,
}: {
  booking: Booking;
  role: UserRole;
  quickReplies: QuickReply[];
}) {
  const t = useTranslations('messagesPage');
  const [selectedReplyId, setSelectedReplyId] = useState('');
  const phone =
    role === 'CLIENT'
      ? booking.masterWhatsappPhone
      : role === 'MASTER'
        ? booking.clientPhone
        : booking.masterWhatsappPhone;
  const name = role === 'CLIENT' ? booking.masterDisplayName : role === 'MASTER' ? booking.clientName : booking.masterDisplayName;
  const id = role === 'CLIENT' ? booking.masterId : role === 'MASTER' ? booking.clientId : booking.masterId;
  const selectedReply = quickReplies.find((r) => r.id === selectedReplyId);
  const messageText = selectedReply?.text ?? waBookingText(booking.serviceTitle, booking.bookingNumber);
  const link = phone ? waLink(phone, messageText) : null;

  if (!phone) return null;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center gap-4 p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-900 transition-[box-shadow,border-color]"
    >
      <img src={getAvatarUrl(id, name)} alt={name} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{name}</h4>
        <p className="text-xs text-slate-500 truncate mt-0.5">{booking.serviceTitle}</p>
        <span className="text-[10px] text-slate-400 mt-0.5 block">{booking.bookingNumber}</span>
      </div>
      {role === 'MASTER' && quickReplies.length > 0 && (
        <select
          value={selectedReplyId}
          onChange={(e) => setSelectedReplyId(e.target.value)}
          className="hidden md:block max-w-[160px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200"
        >
          <option value="">{t('quickReplyDefault')}</option>
          {quickReplies.map((r) => (
            <option key={r.id} value={r.id}>{r.text.slice(0, 40)}</option>
          ))}
        </select>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-success flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shrink-0"
        >
          <Icon name="whatsapp" size={16} />
          <span className="hidden sm:inline">{t('whatsappButton')}</span>
          <span className="sm:hidden">{t('whatsappButtonShort')}</span>
        </a>
      )}
    </motion.div>
  );
}

export default function WhatsAppContactsPage() {
  const t = useTranslations('messagesPage');
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.list({ limit: 100 });
      const relevant = res.items.filter((b) => WHATSAPP_STATUSES.has(b.status));
      setBookings(relevant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches bookings on mount/user change
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role !== 'MASTER') return;
    masterCabinetApi.myQuickReplies().then(setQuickReplies).catch(() => setQuickReplies([]));
  }, [user?.role]);

  const isClient = user?.role === 'CLIENT';
  const isMaster = user?.role === 'MASTER';
  const contacts = bookings.filter((b) =>
    isClient ? b.masterWhatsappPhone : isMaster ? b.clientPhone : b.masterWhatsappPhone,
  );

  if (!user) {
    return (
      <div className="page-shell py-16 text-center">
        <p className="text-sm text-slate-500">{t('loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className="page-shell py-8 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-[#25D366]">
          {t('badge')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && contacts.length === 0 && (
        <EmptyState
          icon="whatsapp"
          tone="emerald"
          title={t('empty')}
          description={t('emptyDesc')}
        />
      )}

      {!loading && contacts.length > 0 && (
        <div className="space-y-4">
          {contacts.map((b) => (
            <WhatsAppContactCard key={b.id} booking={b} role={user.role} quickReplies={quickReplies} />
          ))}
        </div>
      )}
    </div>
  );
}