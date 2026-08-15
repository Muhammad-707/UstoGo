'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, MessagesSquare, Pencil, X } from 'lucide-react';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { QuickReply } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { PageBody } from '@/components/layout/PageBody';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_REPLIES = 20;

export default function QuickRepliesPage() {
  const t = useTranslations('settingsQuickReplies');

  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReplies(await masterCabinetApi.myQuickReplies());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches quick replies on mount
    load();
  }, [load]);

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    setSaving(true);
    setError(null);
    try {
      const created = await masterCabinetApi.createQuickReply(text);
      setReplies((prev) => [...prev, created]);
      setNewText('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (reply: QuickReply) => {
    setEditingId(reply.id);
    setEditingText(reply.text);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await masterCabinetApi.updateQuickReply(editingId, editingText.trim());
      setReplies((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (reply: QuickReply) => {
    setError(null);
    try {
      await masterCabinetApi.removeQuickReply(reply.id);
      setReplies((prev) => prev.filter((r) => r.id !== reply.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('deleteFailed'));
    }
  };

  return (
    <>
    <MasterPageHeader icon="message" eyebrow={t('badge')} title={t('title')} hint={t('pageHint')} />
    <PageBody narrow>

      {error && <Notice tone="danger">{error}</Notice>}

      <Panel title={t('myRepliesTitle')} Icon={MessagesSquare} accent="blue" divided bodyClassName="space-y-3">
        <div className="flex gap-2.5">
          <Input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            maxLength={300}
            placeholder={t('newReplyPlaceholder')}
            disabled={replies.length >= MAX_REPLIES}
            className="flex-1 p-3 rounded-xl font-semibold"
          />
          <Button
            variant="brand"
            onClick={handleAdd}
            disabled={saving || !newText.trim() || replies.length >= MAX_REPLIES}
            className="h-auto px-5 py-3 rounded-2xl bg-slate-900 text-[13px] font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {t('add')}
          </Button>
        </div>
        {replies.length >= MAX_REPLIES && (
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{t('limitReached')}</p>
        )}

        {loading && (
          <div className="space-y-2 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && replies.length === 0 && (
          <EmptyState variant="inline" icon="messagesquare" title={t('empty')} description={t('emptyDesc')} />
        )}

        <div className="space-y-2">
          {replies.map((reply) => (
            <div
              key={reply.id}
              className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
            >
              {editingId === reply.id ? (
                <>
                  <Input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    maxLength={300}
                    className="flex-1 rounded-lg p-2 font-semibold"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="rounded-lg text-emerald-600 dark:text-emerald-400"
                  >
                    <Check size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg text-slate-400"
                  >
                    <X size={16} />
                  </Button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                    {reply.text}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(reply)}
                    className="shrink-0 rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-700"
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(reply)}
                    className="shrink-0 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40"
                  >
                    <X size={14} />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </PageBody>
    </>
  );
}
