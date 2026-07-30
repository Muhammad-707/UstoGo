'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons/LucideIcons';

export const PagePreviewSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const pageGroups = [
    {
      group: 'Core Marketplace',
      pages: [
        { name: 'Landing Page', path: '/' },
        { name: 'Client Home Feed', path: '/home' },
        { name: 'Search Masters', path: '/search' },
        { name: 'Categories (All 15)', path: '/categories' },
        { name: 'Master Profile', path: '/master/master-1' },
        { name: 'Customer Reviews', path: '/reviews' },
      ],
    },
    {
      group: 'Booking & Messages',
      pages: [
        { name: 'Booking Wizard', path: '/booking' },
        { name: 'Booking Live Tracker', path: '/booking/b-101' },
        { name: 'Messages & Chat', path: '/messages' },
        { name: 'Notifications Feed', path: '/notifications' },
        { name: 'Saved Favorites', path: '/favorites' },
      ],
    },
    {
      group: 'Dashboards',
      pages: [
        { name: 'Client Dashboard', path: '/dashboard/client' },
        { name: 'Master Dashboard', path: '/dashboard/master' },
        { name: 'Admin SaaS Panel', path: '/dashboard/admin' },
      ],
    },
    {
      group: 'Master & Client Settings',
      pages: [
        { name: 'Edit Profile', path: '/settings/profile' },
        { name: 'Certificates & Licenses', path: '/settings/certificates' },
        { name: 'Services & Rates', path: '/settings/services' },
        { name: 'Working Schedule', path: '/settings/schedule' },
        { name: 'Payments & Payouts', path: '/payments' },
      ],
    },
    {
      group: 'Auth & Informational',
      pages: [
        { name: 'Login Screen', path: '/auth/login' },
        { name: 'Register Client', path: '/auth/register/client' },
        { name: 'Register Master', path: '/auth/register/master' },
        { name: 'Forgot Password', path: '/auth/forgot-password' },
        { name: 'About UstoGo', path: '/about' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'FAQ Accordions', path: '/faq' },
        { name: '404 Custom Error', path: '/404' },
      ],
    },
  ];

  return (
    <>
      {/* Floating Pill Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 shadow-2xl backdrop-blur-xl hover:scale-105 transition-all duration-300 border border-slate-700/50 dark:border-slate-200/50 group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-tight">Explore 27+ Pages</span>
          <Icon name="Compass" size={16} className="group-hover:rotate-45 transition-transform" />
        </button>
      </div>

      {/* Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-[11px] font-extrabold uppercase">
                    Page Navigator
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    UstoGo Complete UI/UX Catalog
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click any page below to preview high-fidelity interactive screens and responsive layouts.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            {/* Modal Body with Page Groups Grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageGroups.map((group, idx) => (
                <div key={idx} className="bg-slate-50/80 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 mb-3 flex items-center gap-1.5">
                    <Icon name="Grid" size={14} />
                    {group.group}
                  </h4>
                  <ul className="space-y-1.5">
                    {group.pages.map((p) => {
                      const isActive = pathname === p.path;
                      return (
                        <li key={p.path}>
                          <Link
                            href={p.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                              isActive
                                ? 'bg-blue-600 text-white font-bold shadow-md'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-sky-400'
                            }`}
                          >
                            <span>{p.name}</span>
                            <Icon name="ChevronRight" size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Icon name="Sparkles" size={14} className="text-amber-500" />
                Theme Switcher active in top header
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
              >
                Close Previewer
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
