'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarClock, CalendarDays, Clock, Plus } from 'lucide-react';
import { masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import type { ScheduleException, WorkingDay } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { PageBody } from '@/components/layout/PageBody';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker, todayISO } from '@/components/ui/date-picker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

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
    <PageBody narrow>

      {error && <Notice tone="danger">{error}</Notice>}

      <Panel
        title={t('weeklyHoursTitle')}
        Icon={Clock}
        accent="emerald"
        divided
        bodyClassName="space-y-2.5"
      >
        {loading && (
          <div className="space-y-2.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        )}
        {!loading &&
          days.map((day) => (
            <div
              key={day.weekday}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs transition ${
                day.isWorking
                  ? 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : 'border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Switch
                  checked={day.isWorking}
                  onCheckedChange={(checked) => updateDay(day.weekday, { isWorking: checked })}
                  className="shrink-0 data-checked:bg-emerald-500"
                />
                <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {dayLabels[day.weekday]}
                </span>
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

        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={saving || loading}
            className="h-auto px-7 py-3 rounded-2xl bg-slate-900 text-[13px] font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {saving ? t('saving') : t('save')}
          </Button>
          {saved && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('savedOk')}</span>}
        </div>
      </Panel>

      {/* Exceptions */}
      <Panel
        title={t('exceptionsTitle')}
        Icon={CalendarClock}
        accent="blue"
        divided
        bodyClassName="space-y-5"
      >
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
              className="data-checked:bg-blue-600 data-checked:border-blue-600"
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
          variant="ghost"
          onClick={handleAddException}
          disabled={addingExc}
          className="h-auto w-fit gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-blue-950/40"
        >
          {addingExc ? (
            t('saving')
          ) : (
            <>
              <Plus size={13} strokeWidth={2.6} />
              {t('addException')}
            </>
          )}
        </Button>

        {exceptions.length === 0 && (
          <EmptyState
            variant="inline"
            icon="calendar"
            title={t('noExceptions')}
            description={t('noExceptionsDesc')}
          />
        )}
        <div className="space-y-2">
          {exceptions.map((exc) => (
            <div
              key={exc.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CalendarDays size={14} className="shrink-0 text-slate-400" />
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
      </Panel>
    </PageBody>
    </>
  );
}
