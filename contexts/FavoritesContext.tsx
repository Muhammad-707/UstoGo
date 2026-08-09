'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { favoritesApi } from '@/lib/api/endpoints';
import { useAuth } from '@/contexts/AuthContext';

interface FavoritesContextValue {
  favoriteIds: string[];
  isFavorite: (masterId: string) => boolean;
  /** Optimistic — the icon flips immediately and rolls back if the request fails. */
  toggleFavorite: (masterId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Favorites live on the backend (`GET/POST/DELETE /favorites`), not in localStorage —
 * they follow the account across devices, and `GET /favorites` is what the favorites
 * page renders. Only CLIENTs have them; for anyone else this stays an empty, no-op set.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isClient) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears favorites on logout / role change
      setFavoriteIds([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    favoritesApi
      .list()
      .then((masters) => {
        if (!cancelled) setFavoriteIds(masters.map((m) => m.id));
      })
      .catch(() => {
        if (!cancelled) setFavoriteIds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isClient]);

  const isFavorite = useCallback((masterId: string) => favoriteIds.includes(masterId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (masterId: string) => {
      if (!isClient) return;
      const wasFavorite = favoriteIds.includes(masterId);
      setFavoriteIds((prev) => (wasFavorite ? prev.filter((id) => id !== masterId) : [...prev, masterId]));
      try {
        if (wasFavorite) await favoritesApi.remove(masterId);
        else await favoritesApi.add(masterId);
      } catch {
        setFavoriteIds((prev) => (wasFavorite ? [...prev, masterId] : prev.filter((id) => id !== masterId)));
      }
    },
    [isClient, favoriteIds],
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside a FavoritesProvider');
  return ctx;
}
