'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/mockData';

export default function RegisterMasterPage() {
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-lg shadow-2xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase">
            Join Elite Network
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Apply as a Master Craftsman</h2>
          <p className="text-xs text-slate-500">Earn higher rates & build your reputation on UstoGo</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); router.push('/dashboard/master'); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <input type="text" placeholder="Alex Morgan" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Primary Specialty</label>
              <select className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Hourly Rate ($)</label>
              <input type="number" placeholder="45" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Years Experience</label>
              <input type="number" placeholder="10" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload State License / Certificate (PDF or Image)</label>
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-xs text-slate-400">
              Drag & drop files or <span className="text-blue-600 font-bold">browse</span>
            </div>
          </div>

          <button type="submit" className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg btn-ripple">
            Submit Master Application
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already a master? <Link href="/auth/login" className="font-bold text-amber-500 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
