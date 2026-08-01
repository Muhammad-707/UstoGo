'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Certificate } from '@/lib/api/types';

export default function CertificatesPage() {
  const t = useTranslations('settingsCertificates');
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [year, setYear] = useState('');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    masterCabinetApi
      .myCertificates()
      .then(setCerts)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load certificates.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const created = await masterCabinetApi.addCertificate({ title, issuer: issuer || undefined, year: year || undefined });
      setCerts((prev) => [...prev, created]);
      setTitle('');
      setIssuer('');
      setYear('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add certificate.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('craftsmanVerification')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('certificatesLicenses')}</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-extrabold text-xs shadow-md"
        >
          {t('addNewLicense')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <input
              placeholder={t('certificatesLicenses')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
            <input
              placeholder="Issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
            <input
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-5 py-2.5 rounded-2xl bg-amber-600 text-white font-extrabold text-xs shadow-md disabled:opacity-60"
          >
            {t('addNewLicense')}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xl overflow-hidden">
        {loading && <div className="p-6 text-xs text-slate-400 font-semibold">Loading…</div>}
        {!loading && certs.length === 0 && (
          <div className="p-6 text-xs text-slate-400 font-semibold">No certificates added yet.</div>
        )}
        {certs.map((c) => (
          <div key={c.id} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Icon name="Award" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</h3>
                <p className="text-xs text-slate-500">{t('issuerVerified', { issuer: c.issuer ?? '—', year: c.year ?? '—' })}</p>
              </div>
            </div>
            <button
              onClick={() => masterCabinetApi.removeCertificate(c.id).then(() => setCerts((prev) => prev.filter((x) => x.id !== c.id)))}
              className="text-slate-400 hover:text-red-500"
            >
              <Icon name="X" size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
