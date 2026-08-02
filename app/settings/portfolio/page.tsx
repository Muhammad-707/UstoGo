'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { resolveOwnFileUrl, uploadFile } from '@/lib/api/upload';
import type { PortfolioImage } from '@/lib/api/types';

const MAX_IMAGES = 20;

export default function PortfolioPage() {
  const t = useTranslations('settingsPortfolio');

  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await masterCabinetApi.myPortfolio();
      setImages(items);
      const entries = await Promise.all(
        items.map(async (item) => [item.fileId, await resolveOwnFileUrl(item.fileId)] as const),
      );
      setUrls(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (images.length >= MAX_IMAGES) {
      setError(t('limitReached'));
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fileId = await uploadFile(file, 'PORTFOLIO_IMAGE');
      await masterCabinetApi.addPortfolioImage(fileId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (item: PortfolioImage) => {
    if (!window.confirm(t('confirmRemove'))) return;
    setError(null);
    try {
      await masterCabinetApi.removePortfolioImage(item.id);
      setImages((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('removeFailed'));
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setImages(reordered);
    setError(null);
    try {
      await masterCabinetApi.reorderPortfolio(reordered.map((x) => x.id));
    } catch (err) {
      await load();
      setError(err instanceof ApiError ? err.message : t('reorderFailed'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('badge')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">{t('hint')}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= MAX_IMAGES}
          className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md disabled:opacity-60 transition"
        >
          {uploading ? t('uploading') : t('addImage')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
        {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
        {!loading && images.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold py-8 text-center">{t('empty')}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((item, index) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800"
            >
              {urls[item.fileId] ? (
                <img src={urls[item.fileId] ?? undefined} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="image" size={28} className="text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-2 rounded-xl bg-white/20 text-white disabled:opacity-30"
                  title={t('moveLeft')}
                >
                  <Icon name="chevron-left" size={16} />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="p-2 rounded-xl bg-white/20 text-white disabled:opacity-30"
                  title={t('moveRight')}
                >
                  <Icon name="chevron-right" size={16} />
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  className="p-2 rounded-xl bg-red-500/80 text-white"
                  title={t('remove')}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 font-bold mt-4">
          {t('count', { current: images.length, max: MAX_IMAGES })}
        </p>
      </div>
    </div>
  );
}
