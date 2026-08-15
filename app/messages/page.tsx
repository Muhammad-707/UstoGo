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
import { CabinetPage } from '@/components/layout/CabinetPage';
import { Notice } from '@/components/dashboard/Notice';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-emerald-300 hover:shadow-[0_18px_38px_-22px_rgba(16,185,129,0.55)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:border-emerald-900"
    >
      {/* WhatsApp's own green, as a wash in the corner rather than as another green
          rectangle. It is what tells you at a glance which of these cards is a channel
          you can actually open. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-emerald-500/[0.10] blur-2xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-emerald-500/[0.16]"
      />

      <div className="relative flex items-center gap-3">
        <span className="relative shrink-0">
          <img
            src={getAvatarUrl(id, name)}
            alt={name}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-emerald-500/25"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900">
            <Icon name="whatsapp" size={10} />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[14px] font-bold tracking-[-0.01em] text-slate-900 dark:text-white">{name}</h4>
          <p className="truncate text-[12.5px] text-slate-500 dark:text-slate-400">{booking.serviceTitle}</p>
        </div>

        <span className="shrink-0 self-start rounded-md bg-slate-900/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
          {booking.bookingNumber}
        </span>
      </div>

      <div className="relative mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
        {role === 'MASTER' && quickReplies.length > 0 && (
          <Select value={selectedReplyId || undefined} onValueChange={setSelectedReplyId}>
            <SelectTrigger className="min-w-0 flex-1 rounded-xl px-3 py-2 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
              <SelectValue placeholder={t('quickReplyDefault')} />
            </SelectTrigger>
            <SelectContent>
              {quickReplies.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.text.slice(0, 40)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-400 hover:to-teal-500',
              role === 'MASTER' && quickReplies.length > 0 ? '' : 'flex-1',
            )}
          >
            <Icon name="whatsapp" size={15} />
            {t('whatsappButton')}
          </a>
        )}
      </div>
    </motion.article>
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
      setError(err instanceof Error ? err.message : t('errLoadBookings'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

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
    <CabinetPage icon="whatsapp" eyebrow={t('badge')} title={t('title')} hint={t('subtitle')}>
      {error && <Notice tone="danger">{error}</Notice>}

      {loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
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

      {/* A grid, not a stack. Twelve full-width rows each holding a name, a service and
          one button was a table with the lines rubbed out — 90% of every row was empty
          and the page ran off the bottom of the screen. Three to a row, each card the
          size of what it actually says. */}
      {!loading && contacts.length > 0 && (
        <FilterContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contacts.map((b) => (
            <FilterItem key={b.id} className="h-full">
              <WhatsAppContactCard booking={b} role={user.role} quickReplies={quickReplies} />
            </FilterItem>
          ))}
        </FilterContainer>
      )}
    </CabinetPage>
  );
}