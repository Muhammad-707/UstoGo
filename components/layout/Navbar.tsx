'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { setLocale } from '@/i18n/actions';
import { locales, localeMeta, type Locale } from '@/i18n/locales';
import { useAuth, dashboardPathFor } from '@/contexts/AuthContext';
import { notificationsApi } from '@/lib/api/endpoints';
import type { NotificationItem } from '@/lib/api/types';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLocale() as Locale;
  const t = useTranslations('common');
  const [, startTransition] = useTransition();
  const setLang = (l: Locale) => {
    startTransition(() => {
      setLocale(l).then(() => router.refresh());
    });
  };
  const { user, loading, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isDashboard = pathname?.startsWith('/dashboard');

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    notificationsApi.unreadCount().then((res) => setUnreadCount(res.count)).catch(() => {});
    notificationsApi.list({ limit: 5 }).then((res) => setNotifications(res.items)).catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUserDropdown(false);
    router.push('/');
  };

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

  const languages: Array<{ code: Locale; flag: string; label: string }> = locales.map((code) => ({
    code,
    ...localeMeta[code],
  }));

  const currentLangObj = languages.find((l) => l.code === lang) || languages[2];

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

          {/* Dashboard link (only the user's own dashboard, when logged in) */}
          {user && (
            <Link
              href={dashboardPathFor(user.role)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all"
            >
              {t('myDashboard')}
            </Link>
          )}
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdown(!langDropdown)}
              onBlur={() => setTimeout(() => setLangDropdown(false), 200)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition duration-200"
              title={t('selectLanguage')}
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

          {/* Notification Button (hidden entirely when logged out, wrapper kept for spacing) */}
          <div className="relative">
            {user && (
              <>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
                  aria-label={t('notificationsTitle')}
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
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('notificationsTitle')}</h4>
                      <Link href="/notifications" className="text-xs font-semibold text-blue-600 hover:underline">
                        {t('viewAll')}
                      </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="py-4 text-center text-xs text-slate-400">{t('noNotifications')}</p>
                      )}
                      {notifications.map((n) => {
                        const title = (n.payload?.title as string) || '';
                        const message = (n.payload?.message as string) || '';
                        return (
                          <div key={n.id} className="py-3 flex gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 mt-0.5">
                              <Icon name={n.type === 'booking' ? 'Clock' : n.type === 'promo' ? 'Sparkles' : 'CheckCircle2'} size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{title}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Light/Dark Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition duration-200 flex items-center justify-center"
            title={t('toggleThemeTooltip')}
          >
            {darkMode ? <Icon name="Sun" size={18} className="text-amber-400" /> : <Icon name="Moon" size={18} className="text-slate-600" />}
          </button>

          {/* User Profile / Login Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  onBlur={() => setTimeout(() => setUserDropdown(false), 200)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Icon name="User" size={15} />
                  <span className="max-w-[120px] truncate">
                    {user.masterProfile?.displayName || user.clientProfile?.firstName || user.email}
                  </span>
                  <Icon name="ChevronDown" size={14} className={`transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                </button>

                {userDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-2 z-50 animate-fade-in">
                    <Link
                      href={dashboardPathFor(user.role)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-sky-400 flex items-center justify-center">
                        <Icon name="User" size={15} />
                      </div>
                      {t('myDashboard')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">
                        <Icon name="LogOut" size={15} />
                      </div>
                      {t('logOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !loading && (
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {t('logIn')}
                </Link>
              )
            )}

            <Link
              href="/booking"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold shadow-lg shadow-blue-600/25 btn-ripple transition duration-200 flex items-center gap-2"
            >
              <Icon name="Calendar" size={16} />
              <span className="hidden sm:inline">{t('bookService')}</span>
              <span className="sm:hidden">{t('bookShort')}</span>
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
            {user ? (
              <>
                <Link
                  href={dashboardPathFor(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  {t('myDashboard')}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  {t('logOut')}
                </button>
              </>
            ) : (
              !loading && (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950"
                >
                  {t('logIn')}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
};
