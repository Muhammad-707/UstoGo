'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DUSHANBE_CENTER: [number, number] = [38.5598, 68.787];

const pin = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;transform:translate(-50%,-100%);">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="#059669" stroke="white" stroke-width="1.5">
      <path d="M12 22s8-9.5 8-14a8 8 0 1 0-16 0c0 4.5 8 14 8 14z"/>
      <circle cx="12" cy="8" r="3" fill="white"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface ShopLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  /** Recentres the map when the admin picks a city before placing the pin. */
  fallbackCenter?: [number, number] | null;
  onPick: (latitude: number, longitude: number) => void;
}

/**
 * Click (or drag) to place a shop's pin. The same interaction `MasterLocationPicker`
 * uses for a master's own location — kept as a separate component because that one owns
 * its save call to `masterCabinetApi`, while this one is a controlled input inside the
 * admin's shop form and must not talk to the API itself.
 */
export default function ShopLocationPicker({
  latitude,
  longitude,
  fallbackCenter,
  onPick,
}: ShopLocationPickerProps) {
  const point: [number, number] | null = latitude != null && longitude != null ? [latitude, longitude] : null;
  const center = point ?? fallbackCenter ?? DUSHANBE_CENTER;

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
      <MapContainer center={center} zoom={point ? 14 : 11} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPlace onPick={onPick} />
        {point && (
          <Marker
            position={point}
            icon={pin}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = (e.target as L.Marker).getLatLng();
                onPick(pos.lat, pos.lng);
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
