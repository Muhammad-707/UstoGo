'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { reviewsApi, bookingsApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Review, Booking } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { LeaderboardPanel } from '@/components/masters/LeaderboardPanel';
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

  const tabs: Array<{ id: ReviewsTab; label: string; icon: string }> = [
    { id: 'reviews', label: t('tabReviews'), icon: 'MessageSquare' },
    { id: 'leaderboard', label: t('tabLeaderboard'), icon: 'trendingup' },
  ];

  return (
    <div className="page-shell py-12 space-y-10">

      {/* Reviews / Leaderboard switcher */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          {tabs.map((item) => (
            <Button size="raw" variant="ghost"
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                tab === item.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-sky-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* `key` on the wrapper restarts the entry animation on every switch — without it
          React reuses the node and the incoming panel simply appears. */}
      {tab === 'leaderboard' && (
        <div key="leaderboard" className="animate-tab-in">
          <LeaderboardPanel />
        </div>
      )}

      {tab === 'reviews' && (
      <div key="reviews" className="space-y-10 animate-tab-in">

      {/* Header & Rating Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h1>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{avgRating}</span>
            <div className="flex items-center gap-1 text-amber-500 justify-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} name="Star" size={16} className="fill-amber-400" />
              ))}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">{t('basedOn', { count: reviews.length })}</span>
          </div>

          {!isMaster && (
            <Button size="raw" variant="ghost"
              onClick={openModal}
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
            >
              {t('writeReview')}
            </Button>
          )}

        </div>
      </div>

      {/* Reviews List */}
      {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
      {!loading && reviews.length === 0 && <p className="text-xs text-slate-400 font-semibold">{t('noReviewsYet')}</p>}
      <FilterContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((rev, idx) => (
          <FilterItem key={rev.id} index={idx % 2} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={getAvatarUrl(rev.clientId, rev.clientName)} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                <div>
                  <span className="text-[11px] text-slate-400">{fmt.date(rev.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                <Icon name="Star" size={14} className="fill-amber-400" />
                <span>{rev.rating}.0</span>
              </div>
            </div>

            {rev.comment && <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>}

            {rev.reply && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold text-blue-600 dark:text-sky-400">{t('craftsmanResponse')}</span>
                <p>{rev.reply.body}</p>
              </div>
            )}

            {isMaster && !rev.reply && (
              replyOpenFor === rev.id ? (
                <div className="space-y-2">
                  <Textarea
                    rows={2}
                    value={replyDrafts[rev.id] ?? ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                    placeholder={t('replyPlaceholder')}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="raw" variant="ghost"
                      onClick={() => handleReply(rev.id)}
                      disabled={replySubmittingFor === rev.id || !(replyDrafts[rev.id] ?? '').trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                    >
                      {t('sendReply')}
                    </Button>
                    <Button size="raw" variant="ghost"
                      onClick={() => setReplyOpenFor(null)}
                      className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold"
                    >
                      {t('cancelReply')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="raw" variant="ghost"
                  onClick={() => setReplyOpenFor(rev.id)}
                  className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline"
                >
                  {t('replyToReview')}
                </Button>
              )
            )}
          </FilterItem>
        ))}
      </FilterContainer>

      </div>
      )}

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
  );
}