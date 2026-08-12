'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

const DUSHANBE_CENTER: [number, number] = [38.5598, 68.787];

const pin = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;transform:translate(-50%,-100%);">
    <svg viewBox="0 0 24 24" width="32" height="32" fill="#d97706" stroke="white" stroke-width="1.5">
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

interface MasterLocationPickerProps {
  initialLatitude: number | null;
  initialLongitude: number | null;
  cityLatitude?: number | null;
  cityLongitude?: number | null;
  onSaved: (latitude: number | null, longitude: number | null) => void;
}

export default function MasterLocationPicker({
  initialLatitude,
  initialLongitude,
  cityLatitude,
  cityLongitude,
  onSaved,
}: MasterLocationPickerProps) {
  const t = useTranslations('settingsProfile');
  const fallback: [number, number] =
    cityLatitude != null && cityLongitude != null ? [cityLatitude, cityLongitude] : DUSHANBE_CENTER;
  const [point, setPoint] = useState<[number, number] | null>(
    initialLatitude != null && initialLongitude != null ? [initialLatitude, initialLongitude] : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const handleSave = async () => {
    if (!point) return;
    setSaving(true);
    setError(null);
    try {
      const status = await masterCabinetApi.setLocation(point[0], point[1]);
      onSaved(status.latitude, status.longitude);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('locationSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError(null);
    try {
      const status = await masterCabinetApi.setLocation(null, null);
      setPoint(null);
      onSaved(status.latitude, status.longitude);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('locationSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPoint([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium max-w-lg">{t('locationHint')}</p>
        <Button size="raw" variant="ghost"
          type="button"
          onClick={handleUseMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-60 transition"
        >
          <Icon name="navigation" size={14} className={locating ? 'animate-pulse' : ''} />
          {locating ? t('locating') : t('useMyLocation')}
        </Button>
      </div>

      <div className="h-[320px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative z-0">
        <MapContainer center={point ?? fallback} zoom={point ? 14 : 11} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPlace onPick={(lat, lng) => setPoint([lat, lng])} />
          {point && (
            <Marker
              position={point}
              icon={pin}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target as L.Marker;
                  const pos = marker.getLatLng();
                  setPoint([pos.lat, pos.lng]);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {point && (
        <p className="text-[10px] text-slate-400 font-mono">{point[0].toFixed(5)}, {point[1].toFixed(5)}</p>
      )}

      {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <Button size="raw" variant="ghost"
          type="button"
          onClick={handleSave}
          disabled={saving || !point}
          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold disabled:opacity-50 transition"
        >
          {saving ? '...' : t('saveLocation')}
        </Button>
        {(point || (initialLatitude != null)) && (
          <Button size="raw" variant="ghost"
            type="button"
            onClick={handleClear}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold disabled:opacity-50 transition"
          >
            {t('clearLocation')}
          </Button>
        )}
      </div>
    </div>
  );
}
