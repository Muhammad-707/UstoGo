'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-6">
      <div className="w-24 h-24 rounded-3xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-sky-400 flex items-center justify-center shadow-xl">
        <Icon name="Wrench" size={48} className="animate-bounce" />
      </div>
      <div className="space-y-2 max-w-md">
        <span className="text-4xl font-extrabold text-blue-600 dark:text-sky-400 font-mono">404</span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Page Under Construction or Not Found</h1>
        <p className="text-xs text-slate-500">
          The requested page seems to have moved or taken a tea break! Let's get you back on track.
        </p>
      </div>

      <Link
        href="/"
        className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
      >
        Return to Landing Page
      </Link>
    </div>
  );
}
