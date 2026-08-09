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
            <Popup>
              <div className="space-y-1.5 min-w-[190px]">
                <p className="text-xs font-bold text-slate-900">{shop.name}</p>
                {shop.distanceKm != null && (
                  <p className="text-[10px] font-extrabold text-emerald-600">
                    {t('kmAway', { km: shop.distanceKm })}
                  </p>
                )}
                {shop.description && <p className="text-[10px] text-slate-600">{shop.description}</p>}
                <p className="text-[10px] text-slate-500">{shop.address}</p>
                <p className="text-[10px] text-slate-500">{shop.cityName}</p>
                {shop.workingHours && <p className="text-[10px] text-slate-500">{shop.workingHours}</p>}
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="block text-[10px] font-bold text-emerald-600">
                    {shop.phone}
                  </a>
                )}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${shop.latitude}&mlon=${shop.longitude}#map=17/${shop.latitude}/${shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[10px] font-bold text-white bg-emerald-600 rounded-lg py-1.5 mt-1"
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
