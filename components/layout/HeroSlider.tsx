'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useMoney } from '@/lib/money';
import { Icon } from '@/components/icons/LucideIcons';
import { bannersApi, mastersApi } from '@/lib/api/endpoints';
import type { Banner, MasterPublic } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';

export interface SlideData {
  id: number;
  /** For the built-in slides this is an i18n key; for admin banners it is literal text. */
  category: string;
  title: string;
  image: string;
  photographer: string;
  linkUrl?: string | null;
}

export const HERO_SLIDES: SlideData[] = [
  {
    id: 1,
    category: 'heroCategoryElectrical',
    title: 'Certified Electrician • Smart Home Installation',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=2400&q=90',
    photographer: 'Penthouse Interior Shoot',
  },
  {
    id: 2,
    category: 'heroCategoryPlumbing',
    title: 'Master Plumber • Luxury Kitchen Repair',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=2400&q=90',
    photographer: 'Luxury Residence Shoot',
  },
  {
    id: 3,
    category: 'heroCategoryCarpentry',
    title: 'Custom Craftsman • Architectural Woodworking',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=2400&q=90',
    photographer: 'Sunlit Studio Photoshoot',
  },
  {
    id: 4,
    category: 'heroCategoryPainting',
    title: 'Master Painter • Designer Wall Finishes',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=2400&q=90',
    photographer: 'Contemporary Living Room',
  },
  {
    id: 5,
    category: 'heroCategoryHVAC',
    title: 'HVAC Specialist • Climate Control Servicing',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=2400&q=90',
    photographer: 'High-Rise Residence',
  },
  {
    id: 6,
    category: 'heroCategoryCleaning',
    title: 'Sanitization Specialist • Marble & Interior Care',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2400&q=90',
    photographer: 'Modern Kitchen Shoot',
  },
];

export default function HeroSlider() {
  const t = useTranslations('common');
  const { perHour } = useMoney();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showcaseMasters, setShowcaseMasters] = useState<MasterPublic[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  useEffect(() => {
    mastersApi.search({ limit: 3, sort: 'rating:desc' }).then((res) => setShowcaseMasters(res.items)).catch(() => {});
  }, []);

  // Admin-managed HOME_TOP banners replace the stock slides entirely once any exist;
  // the built-in set stays as the fallback so the hero is never blank on a fresh install.
  useEffect(() => {
    bannersApi
      .list('HOME_TOP')
      .then((items) => setBanners(items.filter((b) => b.imageUrl !== null)))
      .catch(() => {});
  }, []);

  const slides: SlideData[] = banners.length > 0
    ? banners.map((banner, idx) => ({
        id: idx + 1,
        category: banner.subtitle ?? '',
        title: banner.title,
        image: banner.imageUrl as string,
        photographer: '',
        linkUrl: banner.linkUrl ?? null,
      }))
    : HERO_SLIDES;
  const usingBanners = banners.length > 0;
  const slideCount = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  // A shorter admin set must not leave the index pointing past the end.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamps the index when the slide source changes
    setCurrentIndex((prev) => (prev >= slideCount ? 0 : prev));
  }, [slideCount]);

  // Autoplay every 5 seconds (5000ms) with smooth fade transition
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const isSwipeLeft = distance > 50;
    const isSwipeRight = distance < -50;

    if (isSwipeLeft) {
      nextSlide();
    } else if (isSwipeRight) {
      prevSlide();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <section
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-slate-950 py-12 lg:py-20 px-4 sm:px-6 lg:px-8"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* =================================================== */}
      {/* 1. BACKGROUND SLIDER IMAGES (6 SLIDES FADE) */}
      {/* =================================================== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-800 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full object-cover object-center transition-transform duration-[8000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />
            </div>
          );
        })}

        {/* Premium Dark Gradient & Vignette Overlay for Crisp Readability */}
        <div className="absolute inset-0 z-20 dark:bg-gradient-to-b dark:from-slate-950/70 dark:via-slate-950/55 dark:to-slate-950/78" />
        <div className="absolute inset-0 z-20 dark:bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(2,6,23,0.6)_100%)]" />
      </div>

      {/* =================================================== */}
      {/* 2. NAVIGATION ARROWS (DESKTOP & TABLET) */}
      {/* =================================================== */}
      <button
        onClick={prevSlide}
        aria-label={t('prevSlideAria')}
        className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 border border-white/20 text-white items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 group"
      >
        <Icon name="ChevronLeft" size={24} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        aria-label={t('nextSlideAria')}
        className="hidden sm:flex absolute right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/25 border border-white/20 text-white items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 group"
      >
        <Icon name="ChevronRight" size={24} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* =================================================== */}
      {/* 3. CURRENT SLIDE INDICATOR BADGE (1/6) */}
      {/* =================================================== */}
      <div className="absolute top-6 right-6 z-40 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-white text-xs font-mono font-bold backdrop-blur-md shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{String(currentIndex + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}</span>
      </div>

      {/* Active Slide Category Pill (Top Left) */}
      {(usingBanners ? slides[currentIndex]?.category : true) && (
        <div className="absolute top-6 left-6 z-40 hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-200 text-xs font-semibold backdrop-blur-md shadow-md">
          <Icon name="Sparkles" size={14} className="text-amber-400 animate-spin-slow" />
          <span>{usingBanners ? slides[currentIndex].category : t(slides[currentIndex].category)}</span>
        </div>
      )}

      {/* =================================================== */}
      {/* 4. HERO CONTENT OVERLAY (TEXT & SEARCH BAR & CARDS) */}
      {/* =================================================== */}
      <div className="relative z-30 max-w-7xl mx-auto w-full text-center space-y-8 pt-6">
        
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-950/90 border border-blue-500/40 text-sky-300 text-xs font-bold shadow-xl backdrop-blur-md animate-fade-in">
          <Icon name="Sparkles" size={16} className="text-amber-400" />
          <span>{t('heroBadge')}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto drop-shadow-md">
          {t('heroTitlePrefix')}{' '}
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
            {t('heroTitleHighlight')}
          </span>{' '}
          {t('heroTitleSuffix')}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed drop-shadow">
          {t('heroSubtitle')}
        </p>

        {/* Search Bar Component */}
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500" />
          <div className="relative flex flex-col sm:flex-row items-center bg-slate-900/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-slate-700/80 gap-2">
            <div className="flex items-center gap-3 pl-4 flex-1 w-full">
              <Icon name="Search" size={22} className="text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent py-3 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/search?q=${encodeURIComponent(searchQuery)}`}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/40 transition btn-ripple flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>{t('searchMasters')}</span>
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Tag Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300 pt-1">
          <span className="font-semibold text-slate-400">{t('popular')}</span>
          {[
            { name: 'Plumber', key: 'tagPlumber' },
            { name: 'Electrician', key: 'tagElectrician' },
            { name: 'AC Repair', key: 'tagACRepair' },
            { name: 'Interior Designer', key: 'tagInteriorDesigner' },
            { name: 'CCTV Setup', key: 'tagCCTVSetup' },
          ].map((tag) => (
            <Link
              key={tag.name}
              href={`/search?category=${encodeURIComponent(tag.name.toLowerCase())}`}
              className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-200 hover:border-blue-400 hover:text-sky-300 hover:bg-slate-800/90 backdrop-blur-md transition shadow-sm"
            >
              {t(tag.key)}
            </Link>
          ))}
        </div>

        {/* Hero Visual Showcase Cards (3 Top Masters) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {showcaseMasters.map((master, idx) => (
            <div
              key={master.id}
              className={
                idx === 1
                  ? 'glass-card rounded-3xl p-5 relative overflow-hidden group bg-slate-900/80 border-2 border-blue-500/50 backdrop-blur-xl hover:border-blue-400 transition duration-300 shadow-xl shadow-blue-900/20'
                  : 'glass-card rounded-3xl p-5 relative overflow-hidden group bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl hover:border-blue-500/50 transition duration-300'
              }
            >
              {idx === 1 && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                  {t('topRatedBadge')}
                </div>
              )}
              <div className="flex items-center gap-4">
                <img src={master.avatarUrl || getAvatarUrl(master.id, master.displayName)} alt={master.displayName} className="w-14 h-14 rounded-2xl object-cover shadow-md border border-slate-700" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{master.displayName}</h4>
                    {master.hasCertificates && <Icon name="ShieldCheck" size={16} className="text-blue-400" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{master.cityName}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400 font-bold mt-1">
                    <Icon name="Star" size={14} className="fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                    <span>{master.ratingAverage} ({master.ratingCount} {t('reviewsWord')})</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{master.priceFrom ? perHour(master.priceFrom) : '—'}</span>
                <Link href={`/master/${master.id}`} className="text-blue-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1">
                  <span>{t('viewDetails')}</span>
                  <Icon name="ChevronRight" size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* =================================================== */}
      {/* 5. PAGINATION DOTS (BOTTOM CENTER) */}
      {/* =================================================== */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-2xl">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={t('goToSlideAria', { n: idx + 1 })}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isActive ? 'w-8 bg-blue-500 shadow-md shadow-blue-500/50' : 'w-2.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
