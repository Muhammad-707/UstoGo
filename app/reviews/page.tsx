'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import {
  MessageSquareQuote,
  PenLine,
  Quote,
  Reply,
  Send,
  Star,
  ThumbsUp,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { reviewsApi, bookingsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Review, Booking } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { cn } from '@/lib/utils';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { EmptyState } from '@/components/ui/EmptyState';
import { LeaderboardPanel } from '@/components/masters/LeaderboardPanel';
import { CabinetFrame } from '@/components/layout/CabinetPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useDateFormat } from '@/lib/datetime';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type ReviewsTab = 'reviews' | 'leaderboard';

export default function ReviewsPage() {
  const t = useTranslations('reviews');
  const fmt = useDateFormat();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER';
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkedBookingId = searchParams?.get('booking') ?? null;
  /**
   * The URL is the tab's only source of truth — `/leaderboard` redirects here with
   * `?tab=leaderboard`, and switching tabs rewrites it. Holding the choice in component
   * state alone meant a reload always came back on Reviews, throwing away the tab the
   * reader was actually on, and it also made the ranking impossible to link to.
   */
  const tab: ReviewsTab = searchParams?.get('tab') === 'leaderboard' ? 'leaderboard' : 'reviews';

  const setTab = (next: ReviewsTab) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (next === 'leaderboard') params.set('tab', 'leaderboard');
    else params.delete('tab');
    const query = params.toString();
    // `scroll: false` — the switcher sits at the top of the page, so jumping to the top
    // after clicking it is movement the reader did not ask for.
    router.replace(query ? `/reviews?${query}` : '/reviews', { scroll: false });
  };

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [replySubmittingFor, setReplySubmittingFor] = useState<string | null>(null);

  useEffect(() => {
    const load = isMaster ? reviewsApi.received() : reviewsApi.myReviews();
    load
      .then((res) => setReviews(res.items))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [isMaster]);

  const openModal = () => {
    setModalOpen(true);
    if (!isMaster) {
      bookingsApi
        .list({ status: 'COMPLETED', limit: 20 })
        .then((res) => {
          setCompletedBookings(res.items);
          const preselect = deepLinkedBookingId && res.items.some((b) => b.id === deepLinkedBookingId)
            ? deepLinkedBookingId
            : res.items[0]?.id;
          if (preselect) setBookingId(preselect);
        })
        .catch(() => setCompletedBookings([]));
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opens the review modal for a deep-linked booking
    if (deepLinkedBookingId && !isMaster) openModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkedBookingId, isMaster]);

  const avgRating =
    reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2) : '—';

  /**
   * Five buckets, always all five. Rendering only the ratings that happen to exist
   * makes a page with three 5-star reviews look like a full distribution — the empty
   * rows are the point of a breakdown.
   */
  const distribution = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r) => Math.round(r.rating) === stars).length,
    }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return counts.map((c) => ({ ...c, percent: (c.count / max) * 100 }));
  }, [reviews]);

  const handleReply = async (reviewId: string) => {
    const body = (replyDrafts[reviewId] ?? '').trim();
    if (!body) return;
    setReplySubmittingFor(reviewId);
    try {
      const updated = await reviewsApi.reply(reviewId, body);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
      setReplyOpenFor(null);
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('replyFailed'));
    } finally {
      setReplySubmittingFor(null);
    }
  };

  const handleSubmit = async () => {
    if (!bookingId) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await reviewsApi.create({
        bookingId,
        rating,
        comment: comment || undefined,
        npsScore: npsScore ?? undefined,
        wouldRecommend: wouldRecommend ?? undefined,
      });
      setReviews((prev) => [created, ...prev]);
      setModalOpen(false);
      setComment('');
      setNpsScore(null);
      setWouldRecommend(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('submitReviewFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: Array<{ id: ReviewsTab; label: string; Icon: LucideIcon }> = [
    { id: 'reviews', label: t('tabReviews'), Icon: MessageSquareQuote },
    { id: 'leaderboard', label: t('tabLeaderboard'), Icon: TrendingUp },
  ];

  return (
    <CabinetFrame>
    <div className="pb-24">

      {/* The page title and the switcher in one band — the *shared* band, so this screen
          opens the same way as every other item in the sidebar. It used to draw its own
          full-bleed hero with its own type scale and its own amber glow, which is what
          made clicking "Баҳодиҳиҳо" feel like leaving the cabinet. */}
      <PageHeader
        icon="messagesquare"
        eyebrow={t('badge')}
        title={t('title')}
        hint={t('subtitle')}
        accent="blue"
        action={
          <div className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
            {tabs.map((item) => (
              <Button
                size="raw"
                variant="ghost"
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200',
                  tab === item.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <item.Icon size={15} />
                {item.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="page-shell space-y-10 py-10">

      {/* `key` on the wrapper restarts the entry animation on every switch — without it
          React reuses the node and the incoming panel simply appears. */}
      {tab === 'leaderboard' && (
        <div key="leaderboard" className="animate-tab-in">
          <LeaderboardPanel />
        </div>
      )}

      {tab === 'reviews' && (
      <div key="reviews" className="space-y-10 animate-tab-in">

      {/* Rating summary */}
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Score + distribution */}
          <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">
            <div className="shrink-0 text-center sm:pr-6 sm:text-left">
              {/* With no reviews this is an em dash, and an em dash at 48px extrabold
                  reads as a black bar, not as "no score yet" — so it greys out. */}
              <div
                className={cn(
                  'text-5xl font-extrabold tracking-tight tabular-nums',
                  reviews.length > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'
                )}
              >
                {avgRating}
              </div>
              <div className="mt-2 flex items-center justify-center gap-0.5 sm:justify-start">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={15}
                    className={
                      reviews.length > 0 && s <= Math.round(Number(avgRating))
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }
                  />
                ))}
              </div>
              <span className="mt-2 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t('basedOn', { count: reviews.length })}
              </span>
            </div>

            {/* Capped: left to grow, five bars stretch the width of the card and the
                breakdown starts reading as a chart of something much bigger. */}
            <div className="w-full max-w-xs space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-6 dark:sm:border-slate-800">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('ratingBreakdown')}
              </p>
              {distribution.map((row) => (
                <div key={row.stars} className="flex items-center gap-2.5">
                  <span className="flex w-6 shrink-0 items-center gap-0.5 text-[11px] font-bold text-slate-500 tabular-nums dark:text-slate-400">
                    {row.stars}
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-[width] duration-700"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="w-5 shrink-0 text-right text-[11px] font-semibold text-slate-400 tabular-nums">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!isMaster && (
            <Button
              size="raw"
              variant="ghost"
              onClick={openModal}
              className="btn-ripple inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
            >
              <PenLine size={15} />
              {t('writeReview')}
            </Button>
          )}
        </div>
      </section>

      {/* Reviews list */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <EmptyState
          icon="MessageSquare"
          title={t('noReviewsYet')}
          description={t('noReviewsDesc')}
          actionLabel={isMaster ? undefined : t('writeReview')}
          actionHref={isMaster ? undefined : '/orders'}
        />
      )}

      {!loading && reviews.length > 0 && (
        <FilterContainer className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {reviews.map((rev, idx) => (
            <FilterItem key={rev.id} index={idx % 2} className="h-full">
              <article className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color] duration-300 hover:border-blue-200 hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900/80">

                {/* Oversized quote mark, behind the content. */}
                <Quote
                  size={72}
                  className="pointer-events-none absolute -right-2 -top-3 text-slate-100 dark:text-slate-800/70"
                  strokeWidth={1.5}
                />

                <header className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(rev.clientId, rev.clientName)}
                      alt=""
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-900"
                    />
                    <div className="leading-tight">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {rev.clientName || t('anonymousClient')}
                      </p>
                      <span className="text-[11px] text-slate-400">{fmt.date(rev.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-2.5 py-1.5 dark:bg-amber-500/10">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200 dark:text-amber-500/30'
                        }
                      />
                    ))}
                  </div>
                </header>

                {rev.comment && (
                  <p className="relative text-sm leading-relaxed text-slate-600 dark:text-slate-300">{rev.comment}</p>
                )}

                {rev.wouldRecommend && (
                  <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <ThumbsUp size={12} />
                    {t('recommends')}
                  </span>
                )}

                {rev.reply && (
                  <div className="relative mt-auto space-y-1.5 rounded-2xl border-l-[3px] border-blue-500 bg-blue-50/70 p-4 dark:bg-slate-800/70">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-sky-400">
                      <Reply size={12} />
                      {t('craftsmanResponse')}
                    </span>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{rev.reply.body}</p>
                  </div>
                )}

                {isMaster && !rev.reply && (
                  <div className="relative mt-auto pt-1">
                    {replyOpenFor === rev.id ? (
                      <div className="space-y-2">
                        <Textarea
                          rows={2}
                          value={replyDrafts[rev.id] ?? ''}
                          onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                          placeholder={t('replyPlaceholder')}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="raw"
                            variant="ghost"
                            onClick={() => handleReply(rev.id)}
                            disabled={replySubmittingFor === rev.id || !(replyDrafts[rev.id] ?? '').trim()}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Send size={12} />
                            {t('sendReply')}
                          </Button>
                          <Button
                            size="raw"
                            variant="ghost"
                            onClick={() => setReplyOpenFor(null)}
                            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-300"
                          >
                            {t('cancelReply')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="raw"
                        variant="ghost"
                        onClick={() => setReplyOpenFor(rev.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition',
                          'hover:border-blue-300 hover:text-blue-600 dark:border-slate-800 dark:text-slate-300 dark:hover:text-sky-400'
                        )}
                      >
                        <Reply size={13} />
                        {t('replyToReview')}
                      </Button>
                    )}
                  </div>
                )}
              </article>
            </FilterItem>
          ))}
        </FilterContainer>
      )}

      </div>
      )}

      </div>

      {/* Write Review Modal (Client rates Master) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="gap-4">
            <DialogHeader>
              <DialogTitle>{t('modalTitle')}</DialogTitle>
            </DialogHeader>

            {completedBookings.length === 0 ? (
              <p className="text-xs text-slate-500">{t('noCompletedBookingsToReview')}</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="review-booking" className="text-slate-400">{t('bookingLabel')}</Label>
                  <Select value={bookingId || undefined} onValueChange={setBookingId}>
                    <SelectTrigger id="review-booking" className="p-3 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {completedBookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.serviceTitle} — {b.masterDisplayName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400">{t('ratingLabel')}</Label>
                  <div className="flex gap-2 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Icon
                        key={s}
                        name="Star"
                        size={24}
                        onClick={() => setRating(s)}
                        className={`cursor-pointer hover:scale-110 transition ${s <= rating ? 'fill-amber-400' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400">{t('npsLabel')}</Label>
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }, (_, s) => s).map((s) => (
                      <Button size="raw" variant="ghost"
                        key={s}
                        type="button"
                        onClick={() => setNpsScore(s)}
                        className={`flex-1 h-8 rounded-lg text-[10px] font-bold transition ${
                          npsScore === s
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>{t('npsLow')}</span>
                    <span>{t('npsHigh')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400">{t('wouldRecommendLabel')}</Label>
                  <div className="flex gap-2">
                    <Button size="raw" variant="ghost"
                      type="button"
                      onClick={() => setWouldRecommend(true)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                        wouldRecommend === true
                          ? 'btn-success'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t('yes')}
                    </Button>
                    <Button size="raw" variant="ghost"
                      type="button"
                      onClick={() => setWouldRecommend(false)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                        wouldRecommend === false
                          ? 'bg-red-600 text-white shadow'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t('no')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-comment" className="text-slate-400">{t('commentsLabel')}</Label>
                  <Textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('commentsPlaceholder')}
                    className="p-4"
                  />
                </div>

                {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

                <Button
                  variant="brand"
                  size="xl"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                >
                  {t('submitReview')}
                </Button>
              </>
            )}
        </DialogContent>
      </Dialog>

    </div>
    </CabinetFrame>
  );
}