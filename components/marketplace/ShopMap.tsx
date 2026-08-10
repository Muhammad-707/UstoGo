'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import type { MarketplaceShop } from '@/lib/api/types';

const DUSHANBE_CENTER: [number, number] = [38.5598, 68.787];

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;transform:translate(-50%,-100%);">
      <svg viewBox="0 0 24 24" width="30" height="30" fill="${color}" stroke="white" stroke-width="1.5">
        <path d="M12 22s8-9.5 8-14a8 8 0 1 0-16 0c0 4.5 8 14 8 14z"/>
        <circle cx="12" cy="8" r="3" fill="white"/>
      </svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

const shopPin = pinIcon('#059669');

interface ShopMapProps {
  shops: MarketplaceShop[];
  /** The caller's own position, once they have asked for "shops near me". */
  origin?: { lat: number; lng: number } | null;
}

export default function ShopMap({ shops, origin }: ShopMapProps) {
  const t = useTranslations('shops');

  // With a geolocation fix the map opens tight on the user; otherwise it frames the
  // whole country, since the branches span Khorog to Panjakent.
  const center: [number, number] = origin
    ? [origin.lat, origin.lng]
    : shops[0]
      ? [shops[0].latitude, shops[0].longitude]
      : DUSHANBE_CENTER;

  return (
    <div className="h-[520px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
      <MapContainer center={center} zoom={origin ? 11 : 6} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {origin && (
          <Circle
            center={[origin.lat, origin.lng]}
            radius={600}
            pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.25, weight: 2 }}
          />
        )}

        {shops.map((shop) => (
          <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={shopPin}>
            <Popup className="ustogo-popup" minWidth={236} maxWidth={236}>
              <div className="w-[236px] p-3.5 space-y-2 font-sans">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-extrabold text-slate-900 leading-tight">{shop.name}</p>
                  {shop.distanceKm != null && (
                    <span className="shrink-0 px-2 py-0.5 rounded-lg bg-emerald-50 text-[10px] font-extrabold text-emerald-700">
                      {t('kmAway', { km: shop.distanceKm })}
                    </span>
                  )}
                </div>
                {shop.description && <p className="text-[10px] text-slate-600">{shop.description}</p>}
                <div className="space-y-1 pt-0.5 text-[10px] text-slate-500">
                  <p>📍 {shop.address}</p>
                  <p>🏙 {shop.cityName}</p>
                  {shop.workingHours && <p>🕘 {shop.workingHours}</p>}
                </div>
                {shop.phone && (
                  <a
                    href={`tel:${shop.phone}`}
                    className="ustogo-popup-btn block text-[11px] font-extrabold !text-emerald-600"
                  >
                    ☎ {shop.phone}
                  </a>
                )}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${shop.latitude}&mlon=${shop.longitude}#map=17/${shop.latitude}/${shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ustogo-popup-btn block text-center text-[11px] font-extrabold !text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl py-2 mt-1 shadow-md shadow-emerald-600/25 transition"
                >
                  {t('openInMaps')}
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
