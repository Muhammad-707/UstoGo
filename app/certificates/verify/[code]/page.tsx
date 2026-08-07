'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { certificatesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { CompletionCertificate } from '@/lib/api/types';
import { CertificateCard } from '@/components/certificates/CertificateCard';

export default function VerifyCertificatePage() {
  const t = useTranslations('certificate');
  const params = useParams();
  const code = params?.code as string;

  const [certificate, setCertificate] = useState<CompletionCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    certificatesApi
      .verify(code)
      .then((data) => {
        if (!cancelled) setCertificate(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      {loading && <p className="text-xs text-slate-400 font-semibold text-center">{t('loading')}</p>}

      {!loading && notFound && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 text-red-500 flex items-center justify-center mx-auto">
            <Icon name="X" size={28} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('notFoundTitle')}</h1>
          <p className="text-xs text-slate-500">{t('notFoundBody')}</p>
        </div>
      )}

      {!loading && certificate && <CertificateCard certificate={certificate} />}
    </div>
  );
}
