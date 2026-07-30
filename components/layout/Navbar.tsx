'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons/LucideIcons';
import { MOCK_NOTIFICATIONS } from '@/lib/mockData';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Language } from '@/lib/i18n/translations';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardDropdown, setDashboardDropdown] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ustogo-theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ustogo-theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ustogo-theme', 'dark');
      setDarkMode(true);
    }
  };

  const navLinks = [
    { href: '/', label: t('landing') },
    { href: '/home', label: t('home') },
    { href: '/categories', label: t('categories') },
    { href: '/search', label: t('searchMasters') },
    { href: '/reviews', label: t('reviews') },
    { href: '/about', label: t('about') },
  ];

  const languages: Array<{ code: Language; flag: string; label: string }> = [
    { code: 'tj', flag: '🇹🇯', label: 'Тоҷикӣ' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' },
    { code: 'en', flag: '🇺🇸', label: 'English' },
  ];

  const currentLangObj = languages.find((l) => l.code === lang) || languages[2];
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
            <Icon name="Wrench" size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent">
                Usto<span className="text-blue-600 dark:text-sky-400">Go</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-1 hidden sm:block">
              {t('brandSub')}
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-sky-400 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Dashboards Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDashboardDropdown(!dashboardDropdown)}
              onBlur={() => setTimeout(() => setDashboardDropdown(false), 200)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all"
            >
              {t('dashboards')}
              <Icon name="ChevronDown" size={14} className={`transition-transform ${dashboardDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {dashboardDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-2 z-50 animate-fade-in">
                <Link
                  href="/dashboard/client"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-sky-400 flex items-center justify-center">
                    <Icon name="User" size={15} />
                  </div>
                  {t('clientDashboard')}
                </Link>
                <Link
                  href="/dashboard/master"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Icon name="Briefcase" size={15} />
                  </div>
                  {t('masterDashboard')}
                </Link>
                <Link
                  href="/dashboard/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-600 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Icon name="BarChart3" size={15} />
                  </div>
                  {t('adminDashboard')}
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdown(!langDropdown)}
              onBlur={() => setTimeout(() => setLangDropdown(false), 200)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition duration-200"
              title="Select Language"
            >
              <span>{currentLangObj.flag}</span>
              <span className="hidden sm:inline">{currentLangObj.label}</span>
              <Icon name="ChevronDown" size={14} className={`transition-transform ${langDropdown ? 'rotate-180' : ''}`} />
            </button>

            {langDropdown && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fade-in">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      lang === l.code
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              aria-label="Notifications"
            >
              <Icon name="Bell" size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
                  <Link href="/notifications" className="text-xs font-semibold text-blue-600 hover:underline">
                    View All
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="py-3 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 mt-0.5">
                        <Icon name={n.type === 'booking' ? 'Clock' : n.type === 'promo' ? 'Sparkles' : 'CheckCircle2'} size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Light/Dark Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition duration-200 flex items-center justify-center"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Icon name="Sun" size={18} className="text-amber-400" /> : <Icon name="Moon" size={18} className="text-slate-600" />}
          </button>

          {/* User Profile / Login Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('logIn')}
            </Link>

            <Link
              href="/booking"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold shadow-lg shadow-blue-600/25 btn-ripple transition duration-200 flex items-center gap-2"
            >
              <Icon name="Calendar" size={16} />
              <span className="hidden sm:inline">{t('bookService')}</span>
              <span className="sm:hidden">Book</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={22} />
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-6 space-y-3 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-4">{t('dashboards')}</span>
            <Link
              href="/dashboard/client"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              {t('clientDashboard')}
            </Link>
            <Link
              href="/dashboard/master"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950"
            >
              {t('masterDashboard')}
            </Link>
            <Link
              href="/dashboard/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              {t('adminDashboard')}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
