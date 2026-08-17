'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import { getAvatarUrl } from '@/lib/placeholders';
import type { MasterPublic } from '@/lib/api/types';

const DUSHANBE_CENTER: [number, number] = [38.5598, 68.787];

function pinIcon(color: string, size = 30) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;transform:translate(-50%,-100%);">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" stroke="white" stroke-width="1.5">
        <path d="M12 22s8-9.5 8-14a8 8 0 1 0-16 0c0 4.5 8 14 8 14z"/>
        <circle cx="12" cy="8" r="3" fill="white"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

const masterPin = pinIcon('#2563EB');
/** A master who dropped their own pin is exact — shown in the brand amber, never nudged. */
const exactPin = pinIcon('#D97706');
const userPin = pinIcon('#059669', 26);

function RecenterOnLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

interface SearchMapProps {
  masters: MasterPublic[];
  userLocation: { lat: number; lng: number } | null;
}

interface MapPoint {
  master: MasterPublic;
  lat: number;
  lng: number;
  exact: boolean;
}

export default function SearchMap({ masters, userLocation }: SearchMapProps) {
  const t = useTranslations('search');
  const tc = useTranslations('common');

  const points = useMemo<MapPoint[]>(() => {
    // A master who set their own coordinates is plotted exactly there. Only the ones
    // falling back to their city's centre get spread apart — otherwise every master in
    // Dushanbe would land on one pixel, and a self-reported pin would be moved off the
    // spot its owner deliberately chose.
    const seen = new Map<string, number>();

    return masters
      .map((m) => {
        const exact = m.latitude != null && m.longitude != null;
        const lat = exact ? (m.latitude as number) : m.cityLatitude;
        const lng = exact ? (m.longitude as number) : m.cityLongitude;
        if (lat == null || lng == null) return null;
        if (exact) return { master: m, lat, lng, exact: true };

        const key = `${String(lat)},${String(lng)}`;
        const count = seen.get(key) ?? 0;
        seen.set(key, count + 1);
        const angle = (count * 47 * Math.PI) / 180;
        const jitter = count === 0 ? 0 : 0.01 + count * 0.004;

        return {
          master: m,
          lat: lat + Math.sin(angle) * jitter,
          lng: lng + Math.cos(angle) * jitter,
          exact: false,
        };
      })
      .filter((p): p is MapPoint => p !== null);
  }, [masters]);

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : points[0]
      ? [points[0].lat, points[0].lng]
      : DUSHANBE_CENTER;

  return (
    <div className="h-[380px] sm:h-[520px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
      <MapContainer center={center} zoom={userLocation ? 12 : 6} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && <RecenterOnLocation lat={userLocation.lat} lng={userLocation.lng} />}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userPin}>
            <Popup>{t('nearMeActive')}</Popup>
          </Marker>
        )}
        {points.map(({ master, lat, lng, exact }) => (
          <Marker key={master.id} position={[lat, lng]} icon={exact ? exactPin : masterPin}>
            <Popup className="ustogo-popup" minWidth={244} maxWidth={244}>
              <div className="w-[244px] font-sans">
                <div className="flex items-start gap-3 p-3.5 pb-3">
                  <img
                    src={master.avatarUrl ?? getAvatarUrl(master.id, master.displayName)}
                    alt={master.displayName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-md shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">
                      {master.displayName}
                    </p>
                    {master.categories.length > 0 && (
                      <p className="text-[10px] font-bold text-blue-600 truncate mt-0.5">
                        {master.categories[0]}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-amber-500 text-[11px] leading-none">★</span>
                      <span className="text-[11px] font-extrabold text-slate-800 leading-none">
                        {Number(master.ratingAverage).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold leading-none">
                        ({master.ratingCount})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-3.5 pb-3 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">
                    📍 {master.cityName}
                  </span>
                  {master.distanceKm != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-700">
                      {t('distanceAway', { km: master.distanceKm.toFixed(1) })}
                    </span>
                  )}
                  {master.completedBookingsCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">
                      ✓ {t('jobsDone', { count: master.completedBookingsCount })}
                    </span>
                  )}
                </div>

                {master.priceFrom != null && (
                  <div className="px-3.5 pb-3 flex items-baseline gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {tc('from')}
                    </span>
                    <span className="text-[15px] font-extrabold text-slate-900 leading-none">
                      {tc('money', { amount: Number(master.priceFrom).toFixed(0) })}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 px-3.5 pb-3.5">
                  <Link
                    href={`/master/${master.id}`}
                    className="ustogo-popup-btn flex items-center justify-center rounded-xl bg-slate-100 py-2 text-[11px] font-extrabold !text-slate-700 !no-underline hover:bg-slate-200 transition"
                  >
                    {t('profile')}
                  </Link>
                  <Link
                    href={`/booking?master=${master.id}`}
                    className="ustogo-popup-btn flex items-center justify-center rounded-xl bg-blue-600 py-2 text-[11px] font-extrabold !text-white !no-underline shadow-md shadow-blue-600/25 hover:bg-blue-700 transition"
                  >
                    {t('bookNow')}
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
