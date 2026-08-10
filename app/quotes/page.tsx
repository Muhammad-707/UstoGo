'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { quotesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { PriceType, Quote } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

const PRICE_TYPES: PriceType[] = ['FIXED', 'HOURLY', 'FROM'];

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  RESPONDED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  DECLINED: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export default function QuotesPage() {
  const t = useTranslations('quotes');
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER';

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('FIXED');
  const [note, setNote] = useState('');
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await quotesApi.list({ limit: 50 });
      setQuotes(res.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches quotes on mount
    load();
  }, [load]);

  const startRespond = (quote: Quote) => {
    setRespondingId(quote.id);
    setEstimatedPrice('');
    setPriceType('FIXED');
    setNote('');
    setDecliningId(null);
  };

  const startDecline = (quote: Quote) => {
    setDecliningId(quote.id);
    setDeclineReason('');
    setRespondingId(null);
  };

  const submitRespond = async () => {
    if (!respondingId) return;
    const price = Number(estimatedPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError(t('validationPriceInvalid'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await quotesApi.respond(respondingId, {
        estimatedPrice: price,
        priceType,
        note: note.trim() || undefined,
      });
      setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setRespondingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const submitDecline = async () => {
    if (!decliningId || declineReason.trim().length < 10) {
      setError(t('validationReasonTooShort'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await quotesApi.decline(decliningId, declineReason.trim());
      setQuotes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setDecliningId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const Header = isMaster ? MasterPageHeader : ClientPageHeader;

  return (
    <>
    <Header icon="calculator" eyebrow={t('badge')} title={t('title')} hint={t('pageHint')} />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
      {!loading && quotes.length === 0 && (
        <EmptyState
          icon="calculator"
          title={t('empty')}
          description={t('emptyDesc')}
          actionLabel={t('findMaster')}
          actionHref="/search"
        />
      )}

      <div className="space-y-4">
        {quotes.map((quote) => (
          <div key={quote.id} className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {isMaster ? quote.clientName : quote.masterDisplayName}
                </h3>
                {quote.serviceTitle && <p className="text-[11px] text-slate-400">{quote.serviceTitle}</p>}
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold shrink-0 ${STATUS_CLASS[quote.status]}`}>
                {t(`status.${quote.status}`)}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">{quote.description}</p>

            {quote.status === 'RESPONDED' && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
                <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  {quote.estimatedPrice} ({t(`priceType.${quote.priceType}`)})
                </p>
                {quote.masterNote && <p className="text-xs text-slate-600 dark:text-slate-300">{quote.masterNote}</p>}
                {!isMaster && (
                  <Link
                    href={`/booking?master=${quote.masterId}${quote.serviceId ? `&service=${quote.serviceId}` : ''}`}
                    className="inline-block mt-1 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline"
                  >
                    {t('bookNow')}
                  </Link>
                )}
              </div>
            )}

            {quote.status === 'DECLINED' && quote.declineReason && (
              <p className="text-xs text-red-600 dark:text-red-400 italic">{quote.declineReason}</p>
            )}

            {isMaster && quote.status === 'PENDING' && respondingId !== quote.id && decliningId !== quote.id && (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => startRespond(quote)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                >
                  {t('respond')}
                </button>
                <button
                  onClick={() => startDecline(quote)}
                  className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold text-xs transition"
                >
                  {t('decline')}
                </button>
              </div>
            )}

            {respondingId === quote.id && (
              <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    placeholder={t('estimatedPriceLabel')}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  />
                  <select
                    value={priceType}
                    onChange={(e) => setPriceType(e.target.value as PriceType)}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                  >
                    {PRICE_TYPES.map((pt) => (
                      <option key={String(pt)} value={String(pt)}>{t(`priceType.${String(pt)}`)}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder={t('noteLabel')}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
                <div className="flex gap-3">
                  <button onClick={submitRespond} disabled={saving} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs disabled:opacity-60">
                    {t('sendResponse')}
                  </button>
                  <button onClick={() => setRespondingId(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold text-xs">
                    {t('cancelAction')}
                  </button>
                </div>
              </div>
            )}

            {decliningId === quote.id && (
              <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-slate-800">
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  rows={2}
                  minLength={10}
                  placeholder={t('declineReasonLabel')}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
                <div className="flex gap-3">
                  <button onClick={submitDecline} disabled={saving} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs disabled:opacity-60">
                    {t('sendDecline')}
                  </button>
                  <button onClick={() => setDecliningId(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-extrabold text-xs">
                    {t('cancelAction')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
