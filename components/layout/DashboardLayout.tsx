'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { getSidebarConfig } from '@/lib/dashboardNav';
import { notificationsApi } from '@/lib/api/endpoints';
import type { NotificationItem } from '@/lib/api/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function DashboardLayout({ children, role, title, subtitle, action }: DashboardLayoutProps) {
  const t = useTranslations('dashboardLayout');
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const config = getSidebarConfig(role);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const loadNotifs = () => {
    notificationsApi.unreadCount().then((res) => setUnread(res.count)).catch(() => {});
    notificationsApi.list({ limit: 5 }).then((res) => setNotifs(res.items)).catch(() => {});
  };

  React.useEffect(() => {
    loadNotifs();
    const interval = setInterval(loadNotifs, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    await notificationsApi.markRead(id).catch(() => {});
    loadNotifs();
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {});
    loadNotifs();
  };

  const displayName = user?.masterProfile?.displayName ?? user?.clientProfile?.firstName ?? user?.email ?? '';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {/* Hero card */}
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} p-5 sm:p-7 shadow-xl ${config.glow} ring-1 ring-black/5`}>
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <div className="absolute -top-20 -right-14 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-12 w-64 h-64 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 w-40 h-40 rounded-full bg-white/5 blur-2xl" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center text-white shadow-inner">
                <Icon name={config.icon} size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.15em]">{config.title}</p>
                <h1 className="text-lg sm:text-2xl font-extrabold text-white truncate">{title}</h1>
                {subtitle && <p className="text-white/70 text-[11px] font-medium truncate">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {action && <div>{action}</div>}

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white transition"
                  aria-label={t('notifications')}
                >
                  <Icon name="bell" size={17} />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white/80 animate-pulse">
                      {unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t('notifications')}</h4>
                      {unread > 0 && (
                        <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">
                          {t('markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifs.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">{t('noNotifs')}</p>
                      )}
                      {notifs.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleMarkRead(n.id)}
                          className={`w-full text-left p-3 rounded-xl transition ${
                            n.isRead
                              ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              : 'bg-blue-50/50 dark:bg-blue-950/20'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{(n.payload?.title as string) ?? ''}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{(n.payload?.message as string) ?? ''}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/25 flex items-center justify-center text-white font-extrabold text-[11px] ring-1 ring-white/30">
                    {displayName.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="hidden sm:inline text-white text-xs font-bold max-w-[110px] truncate">{displayName}</span>
                  <Icon name="chevrondown" size={13} className={`hidden sm:inline text-white/80 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold capitalize">{role}</p>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">
                        <Icon name="logout" size={14} />
                      </div>
                      {t('logOut')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating pill nav, docked over the hero card */}
        <div className="relative z-20 -mt-5 px-1">
          <nav className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/5 dark:shadow-black/30 border border-slate-200/80 dark:border-slate-800 p-1.5">
            {config.nav.map((item, idx) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={`${item.href}-${idx}`}
                  href={item.href}
                  className={`relative shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} text-white shadow-md`
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon name={item.icon} size={14} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pb-10 space-y-6">{children}</main>
    </div>
  );
}
