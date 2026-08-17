'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { CircleCheckBig, Clock, Copy, LifeBuoy, Mail, MessageSquare } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import { Icon } from '@/components/icons/LucideIcons';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

/**
 * Where support mail goes. There is no support endpoint on the API — nothing on the
 * server accepts a contact message — so the form composes real mail rather than
 * pretending to submit. The previous version was a `type="button"` with no handler at
 * all: it accepted a name, an address and a paragraph, and threw all three away without
 * saying so.
 */
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@ustogo.app';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_MESSAGE = 20;

const FIELD_CLASS =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-slate-700 dark:bg-slate-800';

export default function ContactClient() {
  const t = useTranslations('contact');
  const { user } = useAuth();

  // Signed-in readers should not retype what the account already knows. A master carries
  // one display name, a client a first and last name — either is a name to write on mail.
  const accountName = user?.masterProfile?.displayName
    ?? [user?.clientProfile?.firstName, user?.clientProfile?.lastName].filter(Boolean).join(' ');

  const [name, setName] = useState(accountName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const errors = useMemo(() => {
    const found: Record<string, string> = {};
    if (!name.trim()) found.name = t('errName');
    if (!EMAIL_RE.test(email.trim())) found.email = t('errEmail');
    if (message.trim().length < MIN_MESSAGE) found.message = t('errMessage', { count: MIN_MESSAGE });
    return found;
  }, [name, email, message, t]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const subject = t('mailSubject', { name: name.trim() });
    const body = `${message.trim()}\n\n---\n${name.trim()}\n${email.trim()}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked outside a secure context — the address is on screen anyway.
    }
  };

  const show = (field: string) => touched && errors[field];

  return (
    <div className="pb-24">
      <section className="relative isolate overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="absolute -right-32 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="page-shell page-shell-narrow relative space-y-5 py-8 sm:py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/70 dark:text-sky-300">
            <MessageSquare size={13} />
            {t('badge')}
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {t('title')}
          </h1>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <FilterContainer className="page-shell page-shell-narrow grid grid-cols-1 items-start gap-8 py-6 sm:py-12 md:grid-cols-[1.2fr_1fr]">
        <FilterItem index={0}>
          <Card className="space-y-5 rounded-3xl border border-slate-200 p-8 dark:border-slate-800">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('formTitle')}</h2>

            {sent ? (
              // Not "your ticket has been created" — nothing was created. It says what
              // actually happened: the mail client was handed a drafted message.
              <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                  <CircleCheckBig size={22} />
                </span>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">{t('sentTitle')}</h3>
                  <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300">{t('sentDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-xs font-bold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
                >
                  {t('sendAnother')}
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-1.5">
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    aria-label={t('namePlaceholder')}
                    aria-invalid={Boolean(show('name'))}
                    className={cn(FIELD_CLASS, show('name') && 'border-red-400 dark:border-red-500')}
                  />
                  {show('name') && <p className="px-1 text-[11px] font-semibold text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    aria-label={t('emailPlaceholder')}
                    aria-invalid={Boolean(show('email'))}
                    className={cn(FIELD_CLASS, show('email') && 'border-red-400 dark:border-red-500')}
                  />
                  {show('email') && <p className="px-1 text-[11px] font-semibold text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('messagePlaceholder')}
                    aria-label={t('messagePlaceholder')}
                    aria-invalid={Boolean(show('message'))}
                    className={cn(FIELD_CLASS, show('message') && 'border-red-400 dark:border-red-500')}
                  />
                  <div className="flex items-center justify-between px-1">
                    {show('message') ? (
                      <p className="text-[11px] font-semibold text-red-500">{errors.message}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[11px] font-semibold tabular-nums text-slate-400">
                      {message.trim().length}/{MIN_MESSAGE}
                    </span>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-ripple w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-xs font-extrabold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-500 hover:to-indigo-500"
                >
                  {t('submitButton')}
                </motion.button>

                <p className="text-center text-[11px] leading-relaxed text-slate-400">{t('mailtoNote')}</p>
              </form>
            )}
          </Card>
        </FilterItem>

        <FilterItem index={1} className="space-y-5">
          {/* Only channels that exist. The card that used to sit here gave a New York
              street address and a US toll-free number for a marketplace that operates in
              Tajikistan — invented contact details are worse than none, because someone
              eventually tries them. */}
          <Card className="relative space-y-3 overflow-hidden rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-sky-500/10 opacity-60 dark:opacity-20" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-sky-400">
              <Mail size={20} />
            </div>
            <h3 className="relative font-bold text-slate-900 dark:text-white">{t('emailTitle')}</h3>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="relative block text-xs font-bold text-blue-600 hover:underline dark:text-sky-400"
            >
              {SUPPORT_EMAIL}
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="relative flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {copied ? <CircleCheckBig size={12} /> : <Copy size={12} />}
              {copied ? t('copied') : t('copyEmail')}
            </button>
          </Card>

          <Card className="relative space-y-3 overflow-hidden rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-60 dark:opacity-20" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm dark:bg-slate-800 dark:text-emerald-400">
              <Clock size={20} />
            </div>
            <h3 className="relative font-bold text-slate-900 dark:text-white">{t('responseTitle')}</h3>
            <p className="relative text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('responseBody')}</p>
          </Card>

          {/* Most of what arrives by mail is already answered one page over. */}
          <Card className="relative space-y-3 overflow-hidden rounded-3xl border border-slate-200 p-6 dark:border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-60 dark:opacity-20" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-slate-800 dark:text-amber-400">
              <LifeBuoy size={20} />
            </div>
            <h3 className="relative font-bold text-slate-900 dark:text-white">{t('faqTitle')}</h3>
            <p className="relative text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('faqBody')}</p>
            <Link
              href="/faq"
              className="relative inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
            >
              {t('faqAction')}
              <Icon name="arrowright" size={13} />
            </Link>
          </Card>
        </FilterItem>
      </FilterContainer>
    </div>
  );
}
