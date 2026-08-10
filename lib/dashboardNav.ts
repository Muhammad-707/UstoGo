import type { ReactNode } from 'react';

/**
 * `labelKey` is a key in the `dashboardLayout` message namespace, not a label. The nav
 * used to carry English strings straight into the JSX, which is why a Tajik dashboard
 * still read "Overview / Active Jobs / Find Masters" — the labels never went through
 * next-intl at all. Resolving them is `DashboardLayout`'s job, where the hook lives.
 */
export interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
  color: string;
  badge?: number;
}

export interface SidebarConfig {
  role: string;
  accent: string;
  accentLight: string;
  gradientFrom: string;
  gradientTo: string;
  glow: string;
  activeBg: string;
  activeText: string;
  activeBar: string;
  ring: string;
  icon: string;
  /** Key in the `dashboardLayout` namespace — `panelADMIN`, `panelMASTER`, `panelCLIENT`. */
  titleKey: string;
  nav: NavItem[];
}

export const adminSidebar: SidebarConfig = {
  role: 'ADMIN',
  accent: 'purple',
  accentLight: 'purple-50',
  gradientFrom: 'from-purple-600',
  gradientTo: 'to-indigo-700',
  glow: 'shadow-purple-500/30',
  activeBg: 'bg-purple-50 dark:bg-purple-500/10',
  activeText: 'text-purple-700 dark:text-purple-300',
  activeBar: 'bg-gradient-to-b from-purple-500 to-indigo-600',
  ring: 'ring-purple-500/40',
  icon: 'shieldcheck',
  titleKey: 'panelADMIN',
  nav: [
    { href: '/dashboard/admin', labelKey: 'navOverview', icon: 'grid', color: 'bg-purple-500' },
    { href: '/dashboard/admin/users', labelKey: 'navUsers', icon: 'user', color: 'bg-purple-500' },
    { href: '/dashboard/admin/bookings', labelKey: 'navBookings', icon: 'calendar', color: 'bg-purple-500' },
    { href: '/dashboard/admin/reviews', labelKey: 'navReviews', icon: 'star', color: 'bg-purple-500' },
    { href: '/dashboard/admin/reports', labelKey: 'navReports', icon: 'filetext', color: 'bg-purple-500' },
    { href: '/dashboard/admin/certificates', labelKey: 'navCertificates', icon: 'award', color: 'bg-purple-500' },
    { href: '/dashboard/admin/categories', labelKey: 'navCategories', icon: 'grid', color: 'bg-purple-500' },
    { href: '/dashboard/admin/banners', labelKey: 'navBanners', icon: 'image', color: 'bg-purple-500' },
    { href: '/dashboard/admin/broadcast', labelKey: 'navBroadcast', icon: 'bell', color: 'bg-purple-500' },
    { href: '/dashboard/admin/audit-logs', labelKey: 'navAuditLog', icon: 'shieldcheck', color: 'bg-purple-500' },
    { href: '/dashboard/admin/marketplace/products', labelKey: 'navProducts', icon: 'package', color: 'bg-purple-500' },
    { href: '/dashboard/admin/marketplace/categories', labelKey: 'navProductCategories', icon: 'tag', color: 'bg-purple-500' },
    { href: '/dashboard/admin/marketplace/orders', labelKey: 'navOrders', icon: 'shoppingcart', color: 'bg-purple-500' },
    { href: '/dashboard/admin/marketplace/shops', labelKey: 'navShops', icon: 'store', color: 'bg-purple-500' },
  ],
};

export const masterSidebar: SidebarConfig = {
  role: 'MASTER',
  accent: 'amber',
  accentLight: 'amber-50',
  gradientFrom: 'from-amber-500',
  gradientTo: 'to-orange-600',
  glow: 'shadow-amber-500/30',
  activeBg: 'bg-amber-50 dark:bg-amber-500/10',
  activeText: 'text-amber-700 dark:text-amber-300',
  activeBar: 'bg-gradient-to-b from-amber-500 to-orange-600',
  ring: 'ring-amber-500/40',
  icon: 'wrench',
  titleKey: 'panelMASTER',
  nav: [
    { href: '/dashboard/master', labelKey: 'navOverview', icon: 'grid', color: 'bg-amber-500' },
    { href: '/messages', labelKey: 'navWhatsApp', icon: 'whatsapp', color: 'bg-[#25D366]' },
    { href: '/reviews', labelKey: 'navReviews', icon: 'star', color: 'bg-amber-500' },
    { href: '/settings/services', labelKey: 'navServices', icon: 'briefcase', color: 'bg-amber-500' },
    { href: '/settings/schedule', labelKey: 'navSchedule', icon: 'clock', color: 'bg-amber-500' },
    { href: '/settings/profile', labelKey: 'navSettings', icon: 'settings', color: 'bg-amber-500' },
  ],
};

export const clientSidebar: SidebarConfig = {
  role: 'CLIENT',
  accent: 'blue',
  accentLight: 'blue-50',
  gradientFrom: 'from-blue-600',
  gradientTo: 'to-sky-600',
  glow: 'shadow-blue-500/30',
  activeBg: 'bg-blue-50 dark:bg-blue-500/10',
  activeText: 'text-blue-700 dark:text-blue-300',
  activeBar: 'bg-gradient-to-b from-blue-500 to-sky-600',
  ring: 'ring-blue-500/40',
  icon: 'user',
  titleKey: 'panelCLIENT',
  nav: [
    { href: '/dashboard/client', labelKey: 'navOverview', icon: 'grid', color: 'bg-blue-500' },
    { href: '/search', labelKey: 'navFindMasters', icon: 'search', color: 'bg-blue-500' },
    { href: '/messages', labelKey: 'navWhatsApp', icon: 'whatsapp', color: 'bg-[#25D366]' },
    { href: '/favorites', labelKey: 'navFavorites', icon: 'heart', color: 'bg-blue-500' },
    { href: '/marketplace', labelKey: 'navMarketplace', icon: 'shoppingbag', color: 'bg-blue-500' },
    { href: '/cart', labelKey: 'navCart', icon: 'shoppingcart', color: 'bg-blue-500' },
    { href: '/orders', labelKey: 'navOrders', icon: 'package', color: 'bg-blue-500' },
    { href: '/settings/profile', labelKey: 'navSettings', icon: 'settings', color: 'bg-blue-500' },
  ],
};

export function getSidebarConfig(role: string): SidebarConfig {
  if (role === 'ADMIN') return adminSidebar;
  if (role === 'MASTER') return masterSidebar;
  return clientSidebar;
}

export interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}
