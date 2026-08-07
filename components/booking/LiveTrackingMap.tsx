'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';

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
const destinationPin = pinIcon('#DC2626');

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(points, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

interface LiveTrackingMapProps {
  masterLocation: { lat: number; lng: number };
  destination?: { lat: number; lng: number } | null;
}

export default function LiveTrackingMap({ masterLocation, destination }: LiveTrackingMapProps) {
  const t = useTranslations('bookingDetail');
  const points: [number, number][] = destination
    ? [[masterLocation.lat, masterLocation.lng], [destination.lat, destination.lng]]
    : [[masterLocation.lat, masterLocation.lng]];

  return (
    <div className="h-[320px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
      <MapContainer center={points[0]} zoom={14} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        <Marker position={[masterLocation.lat, masterLocation.lng]} icon={masterPin}>
          <Popup>{t('liveTrackingMasterPin')}</Popup>
        </Marker>
        {destination && (
          <>
            <Marker position={[destination.lat, destination.lng]} icon={destinationPin}>
              <Popup>{t('liveTrackingDestinationPin')}</Popup>
            </Marker>
            <Polyline positions={points} pathOptions={{ color: '#2563EB', dashArray: '6 8', weight: 3 }} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
