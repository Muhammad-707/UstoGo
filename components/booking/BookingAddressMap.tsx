'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import { Crosshair, MapPin, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

const DUSHANBE_CENTER: [number, number] = [38.5598, 68.787];

/** The same pin the master's own location picker drops, in the client's blue. */
const pin = L.divIcon({
  className: '',
  html: `<div style="width:34px;height:34px;">
    <svg viewBox="0 0 24 24" width="34" height="34" fill="#2563eb" stroke="white" stroke-width="1.5">
      <path d="M12 22s8-9.5 8-14a8 8 0 1 0-16 0c0 4.5 8 14 8 14z"/>
      <circle cx="12" cy="8" r="3" fill="white"/>
    </svg>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Re-centres when the client changes city, so the map is never looking at the wrong town. */
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

interface BookingAddressMapProps {
  point: [number, number] | null;
  onChange: (point: [number, number] | null) => void;
  /** Centre of the selected city; Dushanbe when the client has not picked one yet. */
  cityLatitude?: number | null;
  cityLongitude?: number | null;
}

/**
 * The exact door, on a real map.
 *
 * The address step used to end with a grey rectangle reading "[ a map goes here ]" — a
 * mock left in a shipped checkout, and the one thing on the page that told the reader the
 * product was unfinished. `POST /bookings` has taken `address.latitude/longitude` all
 * along and nothing was ever sending them, so a master got a street name and had to
 * guess the rest. Dropping a pin here is what fills that in.
 */
export default function BookingAddressMap({
  point,
  onChange,
  cityLatitude,
  cityLongitude,
}: BookingAddressMapProps) {
  const t = useTranslations('booking');
  const [locating, setLocating] = useState(false);

  const center: [number, number] =
    point ??
    (cityLatitude != null && cityLongitude != null ? [cityLatitude, cityLongitude] : DUSHANBE_CENTER);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange([position.coords.latitude, position.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative h-56 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <MapContainer
          center={center}
          zoom={point ? 16 : 12}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter center={center} />
          <ClickToPlace onPick={(lat, lng) => onChange([lat, lng])} />
          {point && (
            <Marker
              position={point}
              icon={pin}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onChange([lat, lng]);
                },
              }}
            />
          )}
        </MapContainer>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] flex items-center justify-between gap-2 p-2.5">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-900/10 bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-slate-900/90 dark:text-slate-300">
            <MapPin size={12} className="text-blue-600 dark:text-sky-400" />
            {point ? t('mapPinPlaced') : t('mapHint')}
          </span>

          <span className="pointer-events-auto flex items-center gap-1.5">
            {point && (
              <Button
                size="raw"
                variant="ghost"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-900/10 bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-slate-900/90 dark:text-slate-300"
              >
                <X size={12} />
                {t('mapClear')}
              </Button>
            )}
            <Button
              size="raw"
              variant="ghost"
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md disabled:opacity-60"
            >
              <Crosshair size={12} />
              {locating ? t('mapLocating') : t('mapUseMyLocation')}
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
