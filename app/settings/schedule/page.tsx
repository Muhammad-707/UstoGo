'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { WorkingDay } from '@/lib/api/types';

type DayUi = WorkingDay & { isWorking: boolean };

const DEFAULT_DAYS: DayUi[] = Array.from({ length: 7 }, (_, i) => ({
  weekday: i,
  startTime: '08:00',
  endTime: '19:00',
  isWorking: i < 6,
}));

const toUi = (days: WorkingDay[]): DayUi[] =>
  DEFAULT_DAYS.map((day) => {
    const saved = days.find((d) => d.weekday === day.weekday);
    return saved
      ? { weekday: day.weekday, startTime: saved.startTime, endTime: saved.endTime, isWorking: true }
      : day;
  });

const toPayload = (days: DayUi[]): Pick<WorkingDay, 'weekday' | 'startTime' | 'endTime'>[] =>
  days
    .filter((day) => day.isWorking)
    .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }));

export default function WorkingSchedulePage() {
  const t = useTranslations('settingsSchedule');
  const dayLabels = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];

  const [days, setDays] = useState<DayUi[]>(DEFAULT_DAYS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    masterCabinetApi
      .mySchedule()
      .then((res) => {
        if (res.length > 0) setDays(toUi(res));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load schedule.'))
      .finally(() => setLoading(false));
  }, []);

  const updateDay = (weekday: number, patch: Partial<DayUi>) => {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await masterCabinetApi.replaceSchedule(toPayload(days));
      setDays(toUi(saved));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save schedule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('availabilityMatrix')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('workingSchedule')}</h1>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-xl">
        {loading && <p className="text-xs text-slate-400 font-semibold">Loading…</p>}
        {!loading &&
          days.map((day) => (
            <div key={day.weekday} className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-900 dark:text-white text-sm">{dayLabels[day.weekday]}</span>
              <div className="flex items-center gap-3">
                {day.isWorking ? (
                  <>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateDay(day.weekday, { startTime: e.target.value })}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => updateDay(day.weekday, { endTime: e.target.value })}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                    />
                  </>
                ) : (
                  <span className="text-slate-500">{t('emergencyOnly')}</span>
                )}
                <button
                  onClick={() => updateDay(day.weekday, { isWorking: !day.isWorking })}
                  className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {t('edit')}
                </button>
              </div>
            </div>
          ))}

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple disabled:opacity-60"
        >
          {t('edit')}
        </button>
      </div>
    </div>
  );
}
