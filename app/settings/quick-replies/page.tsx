'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { QuickReply } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';

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
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            maxLength={300}
            placeholder={t('newReplyPlaceholder')}
            disabled={replies.length >= MAX_REPLIES}
            className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-50"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newText.trim() || replies.length >= MAX_REPLIES}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow disabled:opacity-50 transition"
          >
            {t('add')}
          </button>
        </div>
        {replies.length >= MAX_REPLIES && <p className="text-[10px] text-amber-500 font-bold">{t('limitReached')}</p>}
      </div>

      <div className="space-y-3">
        {replies.map((reply) => (
          <div
            key={reply.id}
            className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3"
          >
            {editingId === reply.id ? (
              <>
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  maxLength={300}
                  className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                />
                <button onClick={handleSaveEdit} disabled={saving} className="text-emerald-600 dark:text-emerald-400">
                  <Icon name="check" size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="text-slate-400">
                  <Icon name="X" size={16} />
                </button>
              </>
            ) : (
              <>
                <p className="flex-1 text-xs font-semibold text-slate-900 dark:text-white">{reply.text}</p>
                <button onClick={() => startEdit(reply)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                  <Icon name="filetext" size={14} />
                </button>
                <button onClick={() => handleRemove(reply)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition">
                  <Icon name="X" size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        {!loading && replies.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold text-center py-8">{t('empty')}</p>
        )}
      </div>
    </div>
    </>
  );
}
