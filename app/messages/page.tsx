'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { conversationsApi } from '@/lib/api/endpoints';
import type { Conversation, Message } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { useAuth } from '@/contexts/AuthContext';
import { getChatSocket } from '@/lib/chat/socket';
import { FilterItem } from '@/components/ui/FilterAnimate';

export default function MessagesPage() {
  const t = useTranslations('messagesPage');
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingIn, setTypingIn] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);

  const loadConversations = useCallback(() => {
    conversationsApi
      .list({ limit: 30 })
      .then((res) => {
        setConversations(res.items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    conversationsApi
      .list({ limit: 30 })
      .then((res) => {
        setConversations(res.items);
        if (res.items.length > 0) setSelected(res.items[0]);
      })
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));

    const socket = getChatSocket();

    const onMessageNew = (payload: { conversationId: string; senderUserId: string; preview: string }) => {
      setConversations((prev) => {
        const target = prev.find((c) => c.id === payload.conversationId);
        const updated = prev.map((c) =>
          c.id === payload.conversationId
            ? {
                ...c,
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: payload.preview,
                unreadCount:
                  payload.senderUserId === user?.id || c.id === selected?.id
                    ? 0
                    : c.unreadCount + 1,
              }
            : c
        );
        if (!target) {
          void conversationsApi
            .list({ limit: 30 })
            .then((res) => setConversations(res.items))
            .catch(() => {});
        }
        return updated;
      });

      if (selected && payload.conversationId === selected.id) {
        if (payload.senderUserId !== user?.id) {
          conversationsApi
            .messages(selected.id)
            .then((res) => setMessages(res.items))
            .catch(() => {});
          conversationsApi.markRead(selected.id).catch(() => {});
        }
      }
    };

    const onTyping = (payload: { conversationId: string; userId: string }) => {
      if (selected && payload.conversationId === selected.id && payload.userId !== user?.id) {
        setTypingIn(payload.conversationId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingIn(null), 2500);
      }
    };

    const onMessagesRead = (payload: { conversationId: string; messageIds: string[] }) => {
      if (!selected || payload.conversationId !== selected.id) return;
      const ids = new Set(payload.messageIds);
      setMessages((prev) => prev.map((m) => (ids.has(m.id) ? { ...m, readAt: new Date().toISOString() } : m)));
    };

    socket?.on('message:new', onMessageNew);
    socket?.on('typing', onTyping);
    socket?.on('message:read', onMessagesRead);

    return () => {
      socket?.off('message:new', onMessageNew);
      socket?.off('typing', onTyping);
      socket?.off('message:read', onMessagesRead);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    conversationsApi
      .messages(selected.id)
      .then((res) => setMessages(res.items))
      .catch(() => setMessages([]));
    conversationsApi.markRead(selected.id).catch(() => {});
    setConversations((prev) => prev.map((c) => (c.id === selected.id ? { ...c, unreadCount: 0 } : c)));
  }, [selected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingIn]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selected) return;
    const body = inputText;
    setInputText('');
    try {
      const sent = await conversationsApi.send(selected.id, body);
      setMessages((prev) => [...prev, sent]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? { ...c, lastMessageAt: sent.createdAt, lastMessagePreview: sent.body, unreadCount: 0 }
            : c
        )
      );
    } catch {
      // ignore
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const now = Date.now();
    if (!selected || now - lastTypingEmitRef.current < 1500) return;
    lastTypingEmitRef.current = now;
    getChatSocket()?.emit('typing', { conversationId: selected.id });
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
            {loading && <div className="p-4 text-xs text-slate-400 font-semibold">{t('loading')}</div>}
            {!loading && conversations.length === 0 && (
              <div className="p-4 text-xs text-slate-400 font-semibold">{t('empty')}</div>
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
                    {typingIn === selected.id && (
                      <p className="text-[11px] text-blue-600 dark:text-sky-400 font-semibold animate-pulse">{t('typing')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => {
                  const mine = msg.senderUserId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col animate-fade-in ${mine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                          mine
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {mine && (
                          <span className={msg.readAt ? 'text-sky-500' : 'text-slate-400'}>
                            {msg.readAt ? '✓✓' : '✓'}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {typingIn === selected.id && (
                  <div className="flex items-start gap-2 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={handleTyping}
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
              {t('selectConversation')}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
