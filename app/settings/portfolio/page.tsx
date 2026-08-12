'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { resolveOwnFileUrl, uploadFile } from '@/lib/api/upload';
import type { PortfolioImage } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches portfolio on mount
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
      revalidateMastersCache();
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
      revalidateMastersCache();
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
    <>
    <MasterPageHeader
      icon="image"
      eyebrow={t('badge')}
      title={t('title')}
      hint={t('hint')}
      action={
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading || images.length >= MAX_IMAGES}
            className="h-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-amber-900/20"
          >
            {uploading ? t('uploading') : `+ ${t('addImage')}`}
          </Button>
        </>
      }
    />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
        {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
        {!loading && images.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
              <Icon name="image" size={26} />
            </div>
            <p className="text-xs text-slate-400 font-semibold">{t('empty')}</p>
          </div>
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
                <Button
                  size="icon"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-xl bg-white/20 hover:bg-white/30 text-white disabled:opacity-30"
                  title={t('moveLeft')}
                >
                  <Icon name="chevron-left" size={16} />
                </Button>
                <Button
                  size="icon"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="rounded-xl bg-white/20 hover:bg-white/30 text-white disabled:opacity-30"
                  title={t('moveRight')}
                >
                  <Icon name="chevron-right" size={16} />
                </Button>
                <Button
                  size="icon"
                  onClick={() => handleRemove(item)}
                  className="rounded-xl bg-red-500/80 hover:bg-red-600 text-white"
                  title={t('remove')}
                >
                  <Icon name="x" size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 font-bold mt-4">
          {t('count', { current: images.length, max: MAX_IMAGES })}
        </p>
      </Card>
    </div>
    </>
  );
}
