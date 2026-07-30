'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { CATEGORIES, MASTERS, MOCK_BOOKINGS } from '@/lib/mockData';

export default function ClientHomePage() {
  const t = useTranslations('common');
  const activeBooking = MOCK_BOOKINGS.find((b) => b.status === 'In Progress') || MOCK_BOOKINGS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-bold border border-blue-400/30">
              {t('clientDashboard')}
            </span>
            <span className="text-xs text-blue-300">• New York, NY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Good Afternoon, Alex! 👋
          </h1>
          <p className="text-sm text-slate-300">
            What home repair or upgrade project can our verified masters assist you with today?
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/search"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
          >
            <Icon name="Search" size={16} />
            <span>{t('searchMasters')}</span>
          </Link>
          <Link
            href="/booking"
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center justify-center gap-2 transition"
          >
            <Icon name="Calendar" size={16} />
            <span>{t('bookService')}</span>
          </Link>
        </div>
      </div>

      {/* Active Booking Ticker Banner */}
      {activeBooking && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-slate-900 rounded-2xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md animate-pulse">
              <Icon name="Clock" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-blue-700 dark:text-sky-300 uppercase tracking-wide">
                  Active Booking #{activeBooking.bookingCode}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {activeBooking.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {activeBooking.serviceName} with {activeBooking.masterName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled for {activeBooking.scheduledDate} ({activeBooking.scheduledTime})
              </p>
            </div>
          </div>

          <Link
            href={`/booking/${activeBooking.id}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition text-center flex items-center justify-center gap-1.5"
          >
            <span>{t('viewTracker')}</span>
          </Link>
        </div>
      )}

      {/* Quick Action Category Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('topCategories')}</h2>
          <Link href="/categories" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
            {t('allServices')} ({CATEGORIES.length})
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="glass-card rounded-2xl p-5 text-center flex flex-col items-center gap-3 group transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition">
                <Icon name={cat.iconName} size={26} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400">{cat.masterCount} {t('mastersCount')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended Top Craftsmen Nearby */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('topRatedCraftsmen')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Available for fast dispatch in under 1 hour</p>
          </div>
          <Link href="/search" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
            {t('viewAllMasters')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MASTERS.map((m) => (
            <div key={m.id} className="glass-card rounded-2xl p-5 space-y-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <img src={m.avatar} alt={m.name} className="w-16 h-16 rounded-2xl object-cover shadow" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</h3>
                    <Icon name="ShieldCheck" size={15} className="text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">{m.category}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Icon name="Star" size={13} className="fill-amber-400" />
                      {m.rating}
                    </span>
                    <span>• {m.distance}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('hourlyRate')}</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">${m.hourlyRate}/hr</span>
                </div>
                <Link
                  href={`/booking?master=${m.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition btn-ripple"
                >
                  {t('bookCraftsman')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
