'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { ScheduleException, WorkingDay } from '@/lib/api/types';

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

const fmtDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export default function WorkingSchedulePage() {
  const t = useTranslations('settingsSchedule');
  const dayLabels = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];

  const [days, setDays] = useState<DayUi[]>(DEFAULT_DAYS);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [excDate, setExcDate] = useState('');
  const [excDayOff, setExcDayOff] = useState(false);
  const [excStart, setExcStart] = useState('');
  const [excEnd, setExcEnd] = useState('');
  const [excNote, setExcNote] = useState('');
  const [addingExc, setAddingExc] = useState(false);

  useEffect(() => {
    Promise.all([masterCabinetApi.mySchedule(), masterCabinetApi.myScheduleExceptions()])
      .then(([schedule, exc]) => {
        if (schedule.length > 0) setDays(toUi(schedule));
        setExceptions(exc);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const updateDay = (weekday: number, patch: Partial<DayUi>) => {
    setDays((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    for (const day of days) {
      if (day.isWorking && day.startTime >= day.endTime) {
        setError(t('validationHours', { day: dayLabels[day.weekday] }));
        return;
      }
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const savedSchedule = await masterCabinetApi.replaceSchedule(toPayload(days));
      setDays(toUi(savedSchedule));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!excDate) {
      setError(t('validationDate'));
      return;
    }
    if (!excDayOff && (!excStart || !excEnd || excStart >= excEnd)) {
      setError(t('validationHoursShort'));
      return;
    }
    setAddingExc(true);
    setError(null);
    try {
      const created = await masterCabinetApi.addScheduleException({
        date: excDate,
        isDayOff: excDayOff,
        ...(excDayOff ? {} : { startTime: excStart, endTime: excEnd }),
        note: excNote.trim() || undefined,
      });
      setExceptions((prev) => [...prev, created]);
      setExcDate('');
      setExcDayOff(false);
      setExcStart('');
      setExcEnd('');
      setExcNote('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('exceptionFailed'));
    } finally {
      setAddingExc(false);
    }
  };

  const handleRemoveException = async (id: string) => {
    setError(null);
    try {
      await masterCabinetApi.removeScheduleException(id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('exceptionFailed'));
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          {t('availabilityMatrix')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('workingSchedule')}</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">{t('scheduleHint')}</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-xl">
        {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
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

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg disabled:opacity-60 transition"
          >
            {saving ? t('saving') : t('save')}
          </button>
          {saved && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('savedOk')}</span>}
        </div>
      </div>

      {/* Exceptions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-xl">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{t('exceptionsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="font-bold text-slate-500">{t('exceptionDate')}</span>
            <input
              type="date"
              min={today}
              value={excDate}
              onChange={(e) => setExcDate(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </label>
          <label className="space-y-1 flex items-end gap-2 pb-1">
            <input
              type="checkbox"
              checked={excDayOff}
              onChange={(e) => setExcDayOff(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <span className="font-bold text-slate-700 dark:text-slate-300">{t('exceptionDayOff')}</span>
          </label>
          {!excDayOff && (
            <>
              <label className="space-y-1">
                <span className="font-bold text-slate-500">{t('exceptionStart')}</span>
                <input
                  type="time"
                  value={excStart}
                  onChange={(e) => setExcStart(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-500">{t('exceptionEnd')}</span>
                <input
                  type="time"
                  value={excEnd}
                  onChange={(e) => setExcEnd(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </label>
            </>
          )}
          <label className="space-y-1 sm:col-span-2">
            <span className="font-bold text-slate-500">{t('exceptionNote')}</span>
            <input
              type="text"
              value={excNote}
              onChange={(e) => setExcNote(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </label>
        </div>
        <button
          onClick={handleAddException}
          disabled={addingExc}
          className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950 transition disabled:opacity-60"
        >
          {addingExc ? t('saving') : t('addException')}
        </button>

        {exceptions.length === 0 && <p className="text-xs text-slate-400 font-semibold">{t('noExceptions')}</p>}
        <div className="space-y-2">
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-white">{fmtDate(exc.date)}</span>
                <span className="ml-2 text-slate-500">
                  {exc.isDayOff
                    ? t('exceptionDayOffShort')
                    : `${exc.startTime} — ${exc.endTime}`}
                </span>
                {exc.note && <span className="ml-2 text-slate-400 italic">{exc.note}</span>}
              </div>
              <button
                onClick={() => handleRemoveException(exc.id)}
                className="text-slate-400 hover:text-red-500 font-bold"
              >
                {t('remove')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
