import type { ReactNode } from 'react';
import {
  Award,
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Clock,
  Compass,
  CreditCard,
  FileText,
  Heart,
  Image,
  LayoutGrid,
  MessageCircle,
  MessagesSquare,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * `labelKey` is a key in the `dashboardLayout` message namespace, not a label. The nav
 * used to carry English strings straight into the JSX, which is why a Tajik dashboard
 * still read "Overview / Active Jobs / Find Masters" — the labels never went through
 * next-intl at all. Resolving them is `DashboardLayout`'s job, where the hook lives.
 *
 * `groupKey` sorts the items into labelled sections in the sidebar. It matters most for
 * admin: fourteen destinations in one flat strip is a strip nobody reads to the end.
 */
export interface NavItem {
  href: string;
  labelKey: string;
  Icon: LucideIcon;
  groupKey: string;
  badge?: number;
  /** Leaves the dashboard for a public page — worth marking so the shell can say so. */
  external?: boolean;
}

export interface SidebarConfig {
  role: string;
  /** Tailwind gradient pair for the role's accent, used by the rail and active states. */
  gradientFrom: string;
  gradientTo: string;
  glow: string;
  /** Soft tint behind an active item in the sidebar. */
  activeBg: string;
  activeText: string;
  /** Icon colour for the active nav item, both themes. */
  navIcon: string;
  /** The role-coloured glow behind the rail header. */
  aura: string;
  Icon: LucideIcon;
  /** Key in the `dashboardLayout` namespace — `panelADMIN`, `panelMASTER`, `panelCLIENT`. */
  titleKey: string;
  nav: NavItem[];
}

export const adminSidebar: SidebarConfig = {
  role: 'ADMIN',
  gradientFrom: 'from-violet-600',
  gradientTo: 'to-indigo-700',
  glow: 'shadow-violet-500/30',
  activeBg: 'bg-violet-50 dark:bg-violet-500/10',
  activeText: 'text-violet-700 dark:text-violet-300',
  navIcon: 'text-violet-600 dark:text-violet-400',
  aura: 'bg-violet-500',
  Icon: ShieldCheck,
  titleKey: 'panelADMIN',
  nav: [
    { href: '/dashboard/admin', labelKey: 'navOverview', Icon: LayoutGrid, groupKey: 'groupOverview' },

    { href: '/dashboard/admin/users', labelKey: 'navUsers', Icon: Users, groupKey: 'groupCommunity' },
    { href: '/dashboard/admin/bookings', labelKey: 'navBookings', Icon: CalendarDays, groupKey: 'groupCommunity' },
    { href: '/dashboard/admin/reviews', labelKey: 'navReviews', Icon: Star, groupKey: 'groupCommunity' },
    { href: '/dashboard/admin/reports', labelKey: 'navReports', Icon: FileText, groupKey: 'groupCommunity' },
    { href: '/dashboard/admin/certificates', labelKey: 'navCertificates', Icon: Award, groupKey: 'groupCommunity' },

    { href: '/dashboard/admin/categories', labelKey: 'navCategories', Icon: LayoutGrid, groupKey: 'groupContent' },
    { href: '/dashboard/admin/banners', labelKey: 'navBanners', Icon: Image, groupKey: 'groupContent' },
    { href: '/dashboard/admin/broadcast', labelKey: 'navBroadcast', Icon: Bell, groupKey: 'groupContent' },
    { href: '/dashboard/admin/audit-logs', labelKey: 'navAuditLog', Icon: ShieldCheck, groupKey: 'groupContent' },

    { href: '/dashboard/admin/marketplace/products', labelKey: 'navProducts', Icon: Package, groupKey: 'groupShop' },
    { href: '/dashboard/admin/marketplace/categories', labelKey: 'navProductCategories', Icon: Tag, groupKey: 'groupShop' },
    { href: '/dashboard/admin/marketplace/orders', labelKey: 'navOrders', Icon: ShoppingCart, groupKey: 'groupShop' },
    { href: '/dashboard/admin/marketplace/shops', labelKey: 'navShops', Icon: Store, groupKey: 'groupShop' },
  ],
};

export const masterSidebar: SidebarConfig = {
  role: 'MASTER',
  gradientFrom: 'from-blue-600',
  gradientTo: 'to-sky-500',
  glow: 'shadow-blue-500/30',
  activeBg: 'bg-blue-50 dark:bg-blue-500/10',
  activeText: 'text-blue-700 dark:text-blue-300',
  navIcon: 'text-blue-600 dark:text-sky-400',
  aura: 'bg-blue-500',
  Icon: Wrench,
  titleKey: 'panelMASTER',
  nav: [
    { href: '/dashboard/master', labelKey: 'navOverview', Icon: LayoutGrid, groupKey: 'groupOverview' },

    { href: '/quotes', labelKey: 'navQuotes', Icon: ClipboardList, groupKey: 'groupWork' },
    { href: '/messages', labelKey: 'navWhatsApp', Icon: MessageCircle, groupKey: 'groupWork' },
    { href: '/reviews', labelKey: 'navReviews', Icon: Star, groupKey: 'groupWork' },
    {
      href: '/dashboard/master/schedule-optimizer',
      labelKey: 'navOptimizer',
      Icon: Compass,
      groupKey: 'groupWork',
    },
    { href: '/payments', labelKey: 'navPayments', Icon: CreditCard, groupKey: 'groupWork' },

    { href: '/settings/services', labelKey: 'navServices', Icon: Briefcase, groupKey: 'groupAccount' },
    { href: '/settings/schedule', labelKey: 'navSchedule', Icon: Clock, groupKey: 'groupAccount' },
    { href: '/settings/portfolio', labelKey: 'navPortfolio', Icon: Image, groupKey: 'groupAccount' },
    { href: '/settings/certificates', labelKey: 'navCertificatesMine', Icon: Award, groupKey: 'groupAccount' },
    { href: '/settings/quick-replies', labelKey: 'navQuickReplies', Icon: MessagesSquare, groupKey: 'groupAccount' },
    { href: '/settings/profile', labelKey: 'navSettings', Icon: Settings, groupKey: 'groupAccount' },
  ],
};

export const clientSidebar: SidebarConfig = {
  role: 'CLIENT',
  gradientFrom: 'from-blue-600',
  gradientTo: 'to-sky-600',
  glow: 'shadow-blue-500/30',
  activeBg: 'bg-blue-50 dark:bg-blue-500/10',
  activeText: 'text-blue-700 dark:text-blue-300',
  navIcon: 'text-blue-600 dark:text-sky-400',
  aura: 'bg-blue-500',
  Icon: User,
  titleKey: 'panelCLIENT',
  nav: [
    { href: '/dashboard/client', labelKey: 'navOverview', Icon: LayoutGrid, groupKey: 'groupOverview' },

    { href: '/search', labelKey: 'navFindMasters', Icon: Search, groupKey: 'groupWork', external: true },
    { href: '/messages', labelKey: 'navWhatsApp', Icon: MessageCircle, groupKey: 'groupWork' },
    { href: '/favorites', labelKey: 'navFavorites', Icon: Heart, groupKey: 'groupWork', external: true },
    { href: '/reviews', labelKey: 'navReviews', Icon: Star, groupKey: 'groupWork' },

    { href: '/marketplace', labelKey: 'navMarketplace', Icon: ShoppingBag, groupKey: 'groupShop', external: true },
    { href: '/cart', labelKey: 'navCart', Icon: ShoppingCart, groupKey: 'groupShop', external: true },
    { href: '/orders', labelKey: 'navOrders', Icon: Package, groupKey: 'groupShop', external: true },

    { href: '/settings/profile', labelKey: 'navSettings', Icon: Settings, groupKey: 'groupAccount' },
  ],
};

export function getSidebarConfig(role: string): SidebarConfig {
  if (role === 'ADMIN') return adminSidebar;
  if (role === 'MASTER') return masterSidebar;
  return clientSidebar;
}

/** Nav items in source order, bucketed by their group, groups in first-seen order. */
export function groupNav(nav: NavItem[]): { groupKey: string; items: NavItem[] }[] {
  const groups: { groupKey: string; items: NavItem[] }[] = [];
  for (const item of nav) {
    const existing = groups.find((g) => g.groupKey === item.groupKey);
    if (existing) existing.items.push(item);
    else groups.push({ groupKey: item.groupKey, items: [item] });
  }
  return groups;
}

export interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}
