'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import type { CompletionCertificate } from '@/lib/api/types';
import { useDateFormat } from '@/lib/datetime';
import { Card } from '@/components/ui/card';

export function CertificateCard({ certificate }: { certificate: CompletionCertificate }) {
  const t = useTranslations('certificate');
  const fmt = useDateFormat();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const verifyUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/certificates/verify/${certificate.verificationCode}`
        : certificate.verificationCode;
    let cancelled = false;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [certificate.verificationCode]);

  return (
    <Card className="rounded-3xl border-2 border-amber-300 dark:border-amber-700 p-8 space-y-6 text-center bg-gradient-to-b from-amber-50/60 to-transparent dark:from-amber-950/20">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg mx-auto">
        <Icon name="shieldcheck" size={26} />
      </div>
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">{t('badge')}</span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
      </div>

      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- locally generated data: URL, not a remote/optimizable asset
        <img src={qrDataUrl} alt={t('qrAlt')} className="mx-auto rounded-2xl border border-slate-200 dark:border-slate-700" />
      )}

      <div className="space-y-2 text-sm">
        <p className="text-slate-900 dark:text-white font-extrabold">{certificate.serviceTitle}</p>
        <p className="text-xs text-slate-500">{t('bookingNumber', { number: certificate.bookingNumber })}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs text-left pt-4 border-t border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block">{t('masterLabel')}</span>
          <span className="text-slate-900 dark:text-white font-semibold">{certificate.masterDisplayName}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block">{t('clientLabel')}</span>
          <span className="text-slate-900 dark:text-white font-semibold">{certificate.clientName}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block">{t('completedLabel')}</span>
          <span className="text-slate-900 dark:text-white font-semibold">{fmt.date(certificate.completedAt)}</span>
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wider block">{t('codeLabel')}</span>
          <span className="text-slate-900 dark:text-white font-mono font-bold">{certificate.verificationCode}</span>
        </div>
      </div>
    </Card>
  );
}
