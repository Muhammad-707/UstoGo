'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';

/**
 * The one place a master is favourited from. Hidden for anyone who is not a CLIENT —
 * `/favorites` is a client-only feature, and a heart nobody can use is worse than none.
 * A logged-out visitor is sent to login rather than silently doing nothing.
 */
export function FavoriteButton({
  masterId,
  size = 'md',
  className = '',
}: {
  masterId: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const t = useTranslations('favorites');
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  if (loading) return null;
  if (user && user.role !== 'CLIENT') return null;

  const active = isFavorite(masterId);
  const box = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const icon = size === 'sm' ? 15 : 18;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    toggleFavorite(masterId);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      aria-pressed={active}
      aria-label={active ? t('removeFromFavorites') : t('addToFavorites')}
      title={active ? t('removeFromFavorites') : t('addToFavorites')}
      className={`${box} shrink-0 rounded-xl flex items-center justify-center border transition-colors duration-200 ${
        active
          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-500'
          : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900'
      } ${className}`}
    >
      <Icon name="heart" size={icon} className={active ? 'fill-red-500' : ''} />
    </motion.button>
  );
}
