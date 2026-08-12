'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import type { ScheduleException, WorkingDay } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { DatePicker, todayISO } from '@/components/ui/date-picker';

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
      revalidateMastersCache();
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

  const today = todayISO();

  return (
    <>
    <MasterPageHeader
      icon="clock"
      eyebrow={t('availabilityMatrix')}
      title={t('workingSchedule')}
      hint={t('scheduleHint')}
    />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-xl">
        {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
        {!loading &&
          days.map((day) => (
            <div
              key={day.weekday}
              className={`flex items-center justify-between p-4 rounded-2xl border text-xs transition ${
                day.isWorking
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={day.isWorking}
                  onCheckedChange={(checked) => updateDay(day.weekday, { isWorking: checked })}
                  className="shrink-0 data-[state=checked]:bg-emerald-500"
                />
                <span className="font-bold text-slate-900 dark:text-white text-sm">{dayLabels[day.weekday]}</span>
              </div>
              {day.isWorking ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => updateDay(day.weekday, { startTime: e.target.value })}
                    className="w-auto p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  />
                  <span className="text-slate-400">—</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => updateDay(day.weekday, { endTime: e.target.value })}
                    className="w-auto p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  />
                </div>
              ) : (
                <span className="text-slate-400 font-bold">{t('emergencyOnly')}</span>
              )}
            </div>
          ))}

        <div className="flex items-center gap-3">
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={saving || loading}
            className="h-auto px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 text-xs"
          >
            {saving ? t('saving') : t('save')}
          </Button>
          {saved && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('savedOk')}</span>}
        </div>
      </Card>

      {/* Exceptions */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 shadow-xl">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="calendar" size={16} className="text-amber-500" />
          {t('exceptionsTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="font-bold text-slate-500">{t('exceptionDate')}</span>
            <DatePicker
              value={excDate}
              min={today}
              onChange={setExcDate}
              aria-label={t('exceptionDate')}
              className="p-3 rounded-xl"
            />
          </label>
          <label className="space-y-1 flex items-end gap-2 pb-1">
            <Checkbox
              checked={excDayOff}
              onCheckedChange={(checked) => setExcDayOff(checked === true)}
              className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
            />
            <span className="font-bold text-slate-700 dark:text-slate-300">{t('exceptionDayOff')}</span>
          </label>
          {!excDayOff && (
            <>
              <label className="space-y-1">
                <span className="font-bold text-slate-500">{t('exceptionStart')}</span>
                <Input
                  type="time"
                  value={excStart}
                  onChange={(e) => setExcStart(e.target.value)}
                  className="p-3 rounded-xl font-semibold"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-500">{t('exceptionEnd')}</span>
                <Input
                  type="time"
                  value={excEnd}
                  onChange={(e) => setExcEnd(e.target.value)}
                  className="p-3 rounded-xl font-semibold"
                />
              </label>
            </>
          )}
          <label className="space-y-1 sm:col-span-2">
            <span className="font-bold text-slate-500">{t('exceptionNote')}</span>
            <Input
              type="text"
              value={excNote}
              onChange={(e) => setExcNote(e.target.value)}
              className="p-3 rounded-xl font-semibold"
            />
          </label>
        </div>
        <Button
          variant="secondary"
          onClick={handleAddException}
          disabled={addingExc}
          className="w-fit h-auto px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950"
        >
          {addingExc ? t('saving') : t('addException')}
        </Button>

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
              <Button
                variant="ghost"
                onClick={() => handleRemoveException(exc.id)}
                className="h-auto p-1 text-slate-400 hover:text-red-500 hover:bg-transparent font-bold text-xs"
              >
                {t('remove')}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </>
  );
}
