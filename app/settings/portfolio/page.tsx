'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, ImageIcon, Plus, X } from 'lucide-react';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { resolveOwnFileUrl, uploadFile } from '@/lib/api/upload';
import type { PortfolioImage } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { PageBody } from '@/components/layout/PageBody';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

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
            className="h-auto gap-1.5 px-5 py-2.5 rounded-2xl bg-slate-900 text-[13px] font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {uploading ? t('uploading') : (<><Plus size={14} strokeWidth={2.6} />{t('addImage')}</>)}
          </Button>
        </>
      }
    />
    <PageBody narrow>

      {error && <Notice tone="danger">{error}</Notice>}

      <Panel
        title={t('galleryTitle')}
        Icon={ImageIcon}
        accent="violet"
        divided
        action={
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t('count', { current: images.length, max: MAX_IMAGES })}
          </span>
        }
      >
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && images.length === 0 && (
          <EmptyState variant="inline" icon="image" title={t('empty')} description={t('emptyDesc')} />
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((item, index) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800"
            >
              {urls[item.fileId] ? (
                <img src={urls[item.fileId] ?? undefined} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon size={26} className="text-slate-300 dark:text-slate-600" />
                </div>
              )}
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-md bg-slate-900/70 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white backdrop-blur-sm">
                  1
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                <Button
                  size="icon"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-xl bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
                  title={t('moveLeft')}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  size="icon"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  className="rounded-xl bg-white/20 text-white hover:bg-white/30 disabled:opacity-30"
                  title={t('moveRight')}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  size="icon"
                  onClick={() => handleRemove(item)}
                  className="rounded-xl bg-rose-500/90 text-white hover:bg-rose-600"
                  title={t('remove')}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </PageBody>
    </>
  );
}
