'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';

import { certificatesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { CompletionCertificate } from '@/lib/api/types';

import { CertificateCard } from '@/components/certificates/CertificateCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

type Outcome = 'loading' | 'valid' | 'notFound' | 'error';

export default function VerifyCertificatePage() {
  const t = useTranslations('certificate');
  const params = useParams();
  const code = params?.code as string;

  const [certificate, setCertificate] = useState<CompletionCertificate | null>(null);
  const [outcome, setOutcome] = useState<Outcome>('loading');

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    certificatesApi
      .verify(code)
      .then((data) => {
        if (cancelled) return;
        setCertificate(data);
        setOutcome('valid');
      })
      .catch((err) => {
        if (cancelled) return;
        // Three outcomes, not two. A 404 means the code is not a certificate; anything
        // else means we could not check. Collapsing them left a 500 or a dropped
        // connection rendering an entirely blank page — the reader could not tell
        // whether the certificate was fake or the site was down.
        setOutcome(err instanceof ApiError && err.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      {outcome === 'loading' && (
        <div className="space-y-4" aria-busy="true" aria-label={t('loading')}>
          <Skeleton className="h-[420px] w-full rounded-3xl" />
          <Skeleton className="mx-auto h-3 w-40" />
        </div>
      )}

      {outcome === 'notFound' && (
        <EmptyState
          icon="x"
          tone="amber"
          title={t('notFoundTitle')}
          description={t('notFoundBody')}
          actionLabel={t('exploreAction')}
          actionHref="/search"
        />
      )}

      {outcome === 'error' && (
        <EmptyState
          icon="alerttriangle"
          tone="amber"
          title={t('errorTitle')}
          description={t('errorBody')}
          actionLabel={t('exploreAction')}
          actionHref="/search"
        />
      )}

      {outcome === 'valid' && certificate && (
        <div className="space-y-6">
          <CertificateCard certificate={certificate} />

          {/* Most readers of this page arrive from a link or a QR code and have never
              seen UstoGo. The certificate alone told them nothing about what it proves. */}
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/25">
              <ShieldCheck size={20} />
            </span>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{t('whatIsTitle')}</h2>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{t('whatIsBody')}</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
            >
              {t('exploreAction')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
