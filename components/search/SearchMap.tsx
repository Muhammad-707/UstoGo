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

export default function SearchMap({ masters, userLocation }: SearchMapProps) {
  const t = useTranslations('search');

  const points = useMemo(() => {
    const seen = new Map<string, number>();
    return masters
      .filter((m) => m.cityLatitude != null && m.cityLongitude != null)
      .map((m) => {
        const key = `${m.cityLatitude},${m.cityLongitude}`;
        const count = seen.get(key) ?? 0;
        seen.set(key, count + 1);
        // Small deterministic jitter so masters in the same city don't stack exactly.
        const angle = (count * 47 * Math.PI) / 180;
        const jitter = count === 0 ? 0 : 0.01 + count * 0.004;
        return {
          master: m,
          lat: (m.cityLatitude as number) + Math.sin(angle) * jitter,
          lng: (m.cityLongitude as number) + Math.cos(angle) * jitter,
        };
      });
  }, [masters]);

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : points[0]
      ? [points[0].lat, points[0].lng]
      : DUSHANBE_CENTER;

  return (
    <div className="h-[520px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
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
        {points.map(({ master, lat, lng }) => (
          <Marker key={master.id} position={[lat, lng]} icon={masterPin}>
            <Popup>
              <div className="space-y-1.5 min-w-[160px]">
                <div className="flex items-center gap-2">
                  <img
                    src={master.avatarUrl ?? getAvatarUrl(master.id, master.displayName)}
                    alt={master.displayName}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{master.displayName}</p>
                    <p className="text-[10px] text-amber-600">★ {master.ratingAverage} ({master.ratingCount})</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">{master.cityName}</p>
                {master.distanceKm != null && (
                  <p className="text-[10px] font-bold text-blue-600">{t('distanceAway', { km: master.distanceKm.toFixed(1) })}</p>
                )}
                <Link href={`/master/${master.id}`} className="block text-center text-[10px] font-bold text-white bg-blue-600 rounded-lg py-1.5 mt-1">
                  {t('profile')}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
