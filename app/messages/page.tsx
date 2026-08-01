'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { conversationsApi } from '@/lib/api/endpoints';
import type { Conversation, Message } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { useAuth } from '@/contexts/AuthContext';
import { FilterItem } from '@/components/ui/FilterAnimate';

export default function MessagesPage() {
  const t = useTranslations('messagesPage');
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    conversationsApi
      .list({ limit: 30 })
      .then((res) => {
        setConversations(res.items);
        if (res.items.length > 0) setSelected(res.items[0]);
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    conversationsApi
      .messages(selected.id)
      .then((res) => setMessages(res.items))
      .catch(() => setMessages([]));
    conversationsApi.markRead(selected.id).catch(() => {});
  }, [selected]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selected) return;
    const body = inputText;
    setInputText('');
    try {
      const sent = await conversationsApi.send(selected.id, body);
      setMessages((prev) => [...prev, sent]);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl h-[750px] flex overflow-hidden">

        {/* Left Contacts Sidebar */}
        <div className="w-full sm:w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">{t('title')}</h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
            {loading && <div className="p-4 text-xs text-slate-400 font-semibold">Loading…</div>}
            {!loading && conversations.length === 0 && (
              <div className="p-4 text-xs text-slate-400 font-semibold">No conversations yet.</div>
            )}
            {conversations.map((c, idx) => (
              <FilterItem
                key={c.id}
                index={idx}
                onClick={() => setSelected(c)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition ${
                  selected?.id === c.id
                    ? 'bg-blue-50 dark:bg-blue-950/60'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="relative">
                  <img src={getAvatarUrl(c.participantUserId)} alt={c.participantName} className="w-12 h-12 rounded-2xl object-cover" />
                  {c.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.participantName}</h4>
                    {c.lastMessageAt && (
                      <span className="text-[10px] text-slate-400">{new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{c.lastMessagePreview ?? ''}</p>
                </div>
              </FilterItem>
            ))}
          </div>
        </div>

        {/* Right Active Chat View */}
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">

          {selected ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={getAvatarUrl(selected.participantUserId)} alt={selected.participantName} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selected.participantName}</h3>
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col animate-fade-in ${msg.senderUserId === user?.id ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.senderUserId === user?.id
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition btn-ripple"
                >
                  {t('send')}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-semibold">
              Select a conversation
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
