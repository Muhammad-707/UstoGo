'use client';

import React from 'react';
import { Icon } from '@/components/icons/LucideIcons';

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          24/7 Support
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Contact UstoGo Support</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send Us a Message</h3>
          <form className="space-y-4">
            <input type="text" placeholder="Your Name" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            <input type="email" placeholder="Email Address" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            <textarea rows={4} placeholder="How can we help?" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            <button className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple">
              Send Support Ticket
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-lg">
            <h4 className="font-bold text-slate-900 dark:text-white">Headquarters</h4>
            <p className="text-xs text-slate-500">750 Lexington Ave, Floor 14, New York, NY 10022</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-lg">
            <h4 className="font-bold text-slate-900 dark:text-white">Emergency Hotline</h4>
            <p className="text-xs text-blue-600 dark:text-sky-400 font-bold">+1 (800) 555-USTO-GO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
