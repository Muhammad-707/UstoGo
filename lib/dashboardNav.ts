import type { ReactNode } from 'react';

export interface NavItem {
  href: string;
  label: string;
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
  icon: string;
  title: string;
  subtitle: string;
  nav: NavItem[];
}

export const adminSidebar: SidebarConfig = {
  role: 'ADMIN',
  accent: 'purple',
  accentLight: 'purple-50',
  gradientFrom: 'from-purple-600',
  gradientTo: 'to-indigo-700',
  icon: 'shieldcheck',
  title: 'Admin Panel',
  subtitle: 'Platform Control',
  nav: [
    { href: '/dashboard/admin', label: 'Overview', icon: 'grid', color: 'bg-purple-500' },
    { href: '/dashboard/admin', label: 'Masters', icon: 'users', color: 'bg-purple-500' },
    { href: '/dashboard/admin', label: 'Bookings', icon: 'calendar', color: 'bg-purple-500' },
    { href: '/dashboard/admin', label: 'Reviews', icon: 'star', color: 'bg-purple-500' },
    { href: '/dashboard/admin', label: 'Notifications', icon: 'bell', color: 'bg-purple-500' },
    { href: '/dashboard/admin', label: 'Platform', icon: 'globe', color: 'bg-purple-500' },
  ],
};

export const masterSidebar: SidebarConfig = {
  role: 'MASTER',
  accent: 'amber',
  accentLight: 'amber-50',
  gradientFrom: 'from-amber-500',
  gradientTo: 'to-orange-600',
  icon: 'wrench',
  title: 'Master Panel',
  subtitle: 'Your Dashboard',
  nav: [
    { href: '/dashboard/master', label: 'Overview', icon: 'grid', color: 'bg-amber-500' },
    { href: '/dashboard/master', label: 'Pending Jobs', icon: 'clock', color: 'bg-amber-500' },
    { href: '/dashboard/master', label: 'Upcoming', icon: 'calendar', color: 'bg-amber-500' },
    { href: '/dashboard/master', label: 'Completed', icon: 'checkcircle2', color: 'bg-amber-500' },
    { href: '/messages', label: 'WhatsApp', icon: 'whatsapp', color: 'bg-[#25D366]' },
    { href: '/settings/services', label: 'Services', icon: 'briefcase', color: 'bg-amber-500' },
    { href: '/settings/schedule', label: 'Schedule', icon: 'clock', color: 'bg-amber-500' },
    { href: '/settings/profile', label: 'Settings', icon: 'settings', color: 'bg-amber-500' },
  ],
};

export const clientSidebar: SidebarConfig = {
  role: 'CLIENT',
  accent: 'blue',
  accentLight: 'blue-50',
  gradientFrom: 'from-blue-600',
  gradientTo: 'to-sky-600',
  icon: 'user',
  title: 'Client Panel',
  subtitle: 'Your Dashboard',
  nav: [
    { href: '/dashboard/client', label: 'Overview', icon: 'grid', color: 'bg-blue-500' },
    { href: '/dashboard/client', label: 'Active Jobs', icon: 'clock', color: 'bg-blue-500' },
    { href: '/dashboard/client', label: 'Completed', icon: 'checkcircle2', color: 'bg-blue-500' },
    { href: '/search', label: 'Find Masters', icon: 'search', color: 'bg-blue-500' },
    { href: '/messages', label: 'WhatsApp', icon: 'whatsapp', color: 'bg-[#25D366]' },
    { href: '/favorites', label: 'Favorites', icon: 'heart', color: 'bg-blue-500' },
    { href: '/settings/profile', label: 'Settings', icon: 'settings', color: 'bg-blue-500' },
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