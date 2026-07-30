'use client';

import React from 'react';
import Link from 'next/link';

export default function EditProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          Account Settings
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Edit Profile</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center gap-6">
          <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80" alt="" className="w-20 h-20 rounded-3xl object-cover border-2 border-blue-500" />
          <button className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
            Change Avatar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Full Name</label>
            <input type="text" defaultValue="Alex Morgan" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
            <input type="text" defaultValue="+1 (555) 234-8901" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300">Bio & Experience</label>
          <textarea rows={4} defaultValue="Licensed master electrician with 12+ years hands-on experience..." className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
        </div>

        <button className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple">
          Save Changes
        </button>
      </div>
    </div>
  );
}
