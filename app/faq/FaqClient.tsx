'use client';

import React, { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ChevronDown, LifeBuoy, Search, X } from 'lucide-react';

import { FAQ_GROUPS } from '@/lib/faq';
import { cn } from '@/lib/utils';

import { Icon } from '@/components/icons/LucideIcons';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/** Case- and diacritic-insensitive contains, so "пардохт" matches "Пардохт". */
const normalize = (value: string): string => value.toLocaleLowerCase();

export default function FaqClient() {
  const t = useTranslations('faq');
  const panelIdBase = useId();

  const [openKey, setOpenKey] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  // Built once per render from the catalogue rather than stored in state: the answers are
  // translations, and a locale switch has to change them.
  const groups = useMemo(
    () =>
      FAQ_GROUPS.map((group) => ({
        ...group,
        label: t(group.labelKey),
        items: group.questions.map((n) => ({ n, q: t(`q${n}`), a: t(`a${n}`) })),
      })),
    [t],
  );

  // Searching the answers too, not just the headings — someone looking for "escrow" or
  // "24 soat" is searching for a rule, and the rule lives in the answer.
  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => normalize(item.q).includes(needle) || normalize(item.a).includes(needle),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const hits = filtered.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="pb-24">
      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="absolute -right-32 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="page-shell page-shell-narrow relative space-y-6 py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/70 dark:text-sky-300">
            <LifeBuoy size={13} />
            {t('badge')}
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {t('title')}
          </h1>
          <p className="mx-auto max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {t('subtitle')}
          </p>

          <div className="relative mx-auto max-w-lg pt-2">
            <Search
              size={18}
              className="pointer-events-none absolute left-5 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="[&::-webkit-search-cancel-button]:appearance-none w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-12 text-sm font-medium text-slate-900 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] outline-none transition placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('clearSearch')}
                className="absolute right-4 top-1/2 mt-1 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="page-shell page-shell-narrow space-y-10 py-12">
        {hits === 0 && (
          <EmptyState
            icon="search"
            title={t('noResults')}
            description={t('noResultsDesc')}
            actionLabel={t('stillAction')}
            actionHref="/contact"
          />
        )}

        {filtered.map((group) => (
          <section key={group.labelKey} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-sky-400">
                <Icon name={group.icon} size={16} />
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {group.label}
              </h2>
            </div>

            <FilterContainer className="space-y-3">
              {group.items.map((item, idx) => {
                const open = openKey === item.n;
                const panelId = `${panelIdBase}-${item.n}`;
                return (
                  <FilterItem key={item.n} index={idx}>
                    <Card
                      className={cn(
                        'overflow-hidden rounded-3xl border transition-colors duration-300',
                        open
                          ? 'border-blue-300 shadow-lg dark:border-sky-800'
                          : 'border-slate-200 dark:border-slate-800',
                      )}
                    >
                      <Button
                        size="raw"
                        variant="ghost"
                        onClick={() => setOpenKey(open ? null : item.n)}
                        aria-expanded={open}
                        aria-controls={panelId}
                        className="group flex w-full items-center justify-between gap-4 p-6 text-left text-base font-bold text-slate-900 dark:text-white"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-extrabold tabular-nums transition-colors',
                              open
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950',
                            )}
                          >
                            {item.n}
                          </span>
                          <span>{item.q}</span>
                        </span>
                        <motion.span
                          animate={{ rotate: open ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                          className={cn('flex-shrink-0', open ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400')}
                        >
                          <ChevronDown size={18} />
                        </motion.span>
                      </Button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            id={panelId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="px-6 pb-6 pl-[3.75rem] text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </FilterItem>
                );
              })}
            </FilterContainer>
          </section>
        ))}

        {/* The way out of a FAQ that did not answer the question. Nothing else on the
            page linked to /contact, so the page ended in a dead end. */}
        {hits > 0 && (
          <Card className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 p-8 text-center sm:flex-row sm:text-left dark:border-slate-800">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/25">
              <LifeBuoy size={24} />
            </span>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{t('stillTitle')}</h3>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('stillDesc')}</p>
            </div>
            <Link
              href="/contact"
              className="flex shrink-0 items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
            >
              {t('stillAction')}
              <Icon name="arrowright" size={14} />
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
