'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { uploadFile } from '@/lib/api/upload';
import type { Certificate } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DatePicker, todayISO } from '@/components/ui/date-picker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function CertificatesPage() {
  const t = useTranslations('settingsCertificates');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    masterCabinetApi
      .myCertificates()
      .then(setCerts)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const handleAdd = async () => {
    if (!title.trim()) {
      setError(t('validationTitle'));
      return;
    }
    setAdding(true);
    setError(null);
    try {
      let fileId: string | undefined;
      if (file) {
        fileId = await uploadFile(file, 'CERTIFICATE');
      }
      const created = await masterCabinetApi.addCertificate({
        title: title.trim(),
        issuer: issuer.trim() || undefined,
        issuedAt: issuedAt ? `${issuedAt}T00:00:00.000Z` : undefined,
        fileId,
      });
      setCerts((prev) => [...prev, created]);
      setTitle('');
      setIssuer('');
      setIssuedAt('');
      setFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('addFailed'));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setError(null);
    try {
      await masterCabinetApi.removeCertificate(id);
      setCerts((prev) => prev.filter((x) => x.id !== id));
      revalidateMastersCache();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('removeFailed'));
    }
  };

  return (
    <>
    <MasterPageHeader
      icon="award"
      eyebrow={t('craftsmanVerification')}
      title={t('certificatesLicenses')}
      hint={t('certificateHint')}
      action={
        <Button
          onClick={() => setShowForm((s) => !s)}
          className="h-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-amber-900/20"
        >
          + {t('addNewLicense')}
        </Button>
      }
    />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <Input
              placeholder={t('titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded-xl font-semibold"
            />
            <Input
              placeholder={t('issuerPlaceholder')}
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="p-3 rounded-xl font-semibold"
            />
            <DatePicker
              value={issuedAt}
              onChange={setIssuedAt}
              max={todayISO()}
              aria-label={t('issuedAtLabel')}
              className="p-3 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="h-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
            >
              {file ? file.name : t('uploadFile')}
            </Button>
            {file && <span className="text-[10px] text-emerald-600 font-bold">{t('fileAttached')}</span>}
          </div>
          <Button
            variant="brand"
            onClick={handleAdd}
            disabled={adding}
            className="h-auto px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 text-xs shadow-md"
          >
            {adding ? t('saving') : t('addNewLicense')}
          </Button>
        </Card>
      )}

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xl overflow-hidden">
        {loading && (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && certs.length === 0 && (
          <EmptyState
            variant="inline"
            icon="award"
            title={t('noCertificates')}
            description={t('noCertificatesDesc')}
          />
        )}
        {certs.map((c) => (
          <div key={c.id} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Icon name="Award" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-xs text-slate-500">
                  {t('issuerVerified', {
                    issuer: c.issuer ?? '—',
                    year: c.issuedAt ? new Date(c.issuedAt).getFullYear() : '—',
                  })}
                </p>
                {c.fileId && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t('fileAttached')}</span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleRemove(c.id)} className="text-slate-400 hover:text-red-500">
              <Icon name="X" size={18} />
            </Button>
          </div>
        ))}
      </Card>
    </div>
    </>
  );
}
