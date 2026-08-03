'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { getSidebarConfig, type SidebarConfig } from '@/lib/dashboardNav';
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
  const { user } = useAuth();
  const config = getSidebarConfig(role);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl fixed top-0 left-0 bottom-0 z-40">
        {/* Sidebar Header */}
        <div className={`relative h-32 bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-end p-6`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <Icon name={config.icon} size={22} />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-sm">{config.title}</h2>
              <p className="text-white/70 text-[10px] font-semibold">{config.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {config.nav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon name={item.icon} size={16} className={isActive ? 'text-slate-900 dark:text-white' : ''} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer — User */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-extrabold text-xs">
              {user?.masterProfile?.displayName?.charAt(0) ?? user?.clientProfile?.firstName?.charAt(0) ?? user?.email?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.masterProfile?.displayName ?? user?.clientProfile?.firstName ?? user?.email}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold capitalize">{role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-[10px] text-slate-400 font-semibold">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {action && <div>{action}</div>}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t('notifications')}
              >
                <Icon name="bell" size={18} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
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
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-10">{children}</div>
      </main>
    </div>
  );
}