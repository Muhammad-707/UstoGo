'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const PagePreviewSwitcher: React.FC = () => {
  const t = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const pageGroups = [
    {
      group: t('ppGroupCore'),
      pages: [
        { name: t('ppLandingPage'), path: '/' },
        { name: t('ppClientHomeFeed'), path: '/home' },
        { name: t('searchMasters'), path: '/search' },
        { name: t('ppCategoriesAll'), path: '/categories' },
        { name: t('ppMasterProfile'), path: '/master/master-1' },
        { name: t('customerReviews'), path: '/reviews' },
      ],
    },
    {
      group: t('ppGroupBooking'),
      pages: [
        { name: t('ppBookingWizard'), path: '/booking' },
        { name: t('ppBookingLiveTracker'), path: '/booking/b-101' },
        { name: t('ppWhatsAppContacts'), path: '/messages' },
        { name: t('ppNotificationsFeed'), path: '/notifications' },
        { name: t('ppSavedFavorites'), path: '/favorites' },
      ],
    },
    {
      group: t('ppGroupDashboards'),
      pages: [
        { name: t('clientDashboard'), path: '/dashboard/client' },
        { name: t('masterDashboard'), path: '/dashboard/master' },
        { name: t('adminDashboard'), path: '/dashboard/admin' },
      ],
    },
    {
      group: t('ppGroupSettings'),
      pages: [
        { name: t('ppEditProfile'), path: '/settings/profile' },
        { name: t('ppCertificatesLicenses'), path: '/settings/certificates' },
        { name: t('ppServicesRates'), path: '/settings/services' },
        { name: t('ppWorkingSchedule'), path: '/settings/schedule' },
        { name: t('ppPortfolio'), path: '/settings/portfolio' },
        { name: t('ppPaymentsPayouts'), path: '/payments' },
      ],
    },
    {
      group: t('ppGroupAuth'),
      pages: [
        { name: t('ppLoginScreen'), path: '/auth/login' },
        { name: t('ppRegisterClient'), path: '/auth/register/client' },
        { name: t('ppRegisterMaster'), path: '/auth/register/master' },
        { name: t('ppForgotPasswordPage'), path: '/auth/forgot-password' },
        { name: t('aboutUstoGo'), path: '/about' },
        { name: t('ppContactUs'), path: '/contact' },
        { name: t('ppFaqAccordions'), path: '/faq' },
        { name: t('ppError404'), path: '/404' },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Floating Pill Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <DialogTrigger asChild>
          <Button className="h-auto gap-2.5 px-4 py-3 rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 hover:bg-slate-900 dark:hover:bg-white shadow-2xl backdrop-blur-xl hover:scale-105 transition-all duration-300 border-slate-700/50 dark:border-slate-200/50 group">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold tracking-tight">{t('explorePages')}</span>
            <Icon name="Compass" size={16} className="group-hover:rotate-45 transition-transform" />
          </Button>
        </DialogTrigger>
      </div>

      {/* Modal Drawer */}
      <DialogContent
        showCloseButton={false}
        className="w-full sm:max-w-4xl max-h-[85vh] p-0 gap-0 rounded-3xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between space-y-0 bg-slate-50/50 dark:bg-slate-950/50 text-left">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-[11px] font-extrabold uppercase border-transparent">
                {t('ppBadge')}
              </Badge>
              <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-white">
                {t('ppHeading')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('ppSub')}
            </DialogDescription>
          </div>

          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={t('ppClose')}
            >
              <Icon name="X" size={20} />
            </Button>
          </DialogClose>
        </DialogHeader>

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
        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex-row items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Icon name="Sparkles" size={14} className="text-amber-500" />
            {t('ppFooterNote')}
          </span>
          <DialogClose asChild>
            <Button className="h-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold">
              {t('ppClose')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
