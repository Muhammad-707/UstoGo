'use client';

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  PHONE_COUNTRIES,
  checkNational,
  countryByIso,
  digitsOf,
  formatNational,
  lengthsLabel,
  parseE164,
  toE164,
} from '@/lib/phone';

export interface PhoneFieldProps {
  /** E.164 (`+992901234567`), or `''` while the field is empty. */
  value: string;
  /** Fires with E.164 on every keystroke, and with `''` when the number is cleared. */
  onChange: (e164: string) => void;
  /** A message the form itself decided on — wins over the field's own live check. */
  error?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * A country and a national number, as one control.
 *
 * The country is picked from a list, the number is grouped as it is typed, the length is
 * checked against that country's numbering plan, and the value handed back is always
 * E.164 — so what the form sends and what the reader sees can never disagree.
 *
 * The live check waits until the field has been left once, or until the number is long
 * enough to judge: an error that appears on the second keystroke of someone's own number
 * is noise, not help.
 */
export function PhoneField({ value, onChange, error, className, id, disabled }: PhoneFieldProps) {
  const t = useTranslations('phone');
  const [iso, setIso] = useState(() => parseE164(value).country.iso);
  const [touched, setTouched] = useState(false);

  const country = countryByIso(iso);

  /** The digits after the dial code — what the input actually edits. */
  const national = useMemo(() => {
    const digits = digitsOf(value);
    if (!digits) return '';
    return digits.startsWith(country.dial) ? digits.slice(country.dial.length) : digits;
  }, [value, country.dial]);

  const emit = (nextCountryIso: string, nextNational: string) => {
    const next = countryByIso(nextCountryIso);
    const digits = digitsOf(nextNational).slice(0, Math.max(...next.lengths));
    onChange(digits ? toE164(next, digits) : '');
  };

  const problem = national ? checkNational(country, national) : null;
  const longEnough = digitsOf(national).length >= Math.min(...country.lengths);
  const liveError =
    problem && (touched || longEnough)
      ? problem === 'length'
        ? t('error.length', { digits: lengthsLabel(country) })
        : t(`error.${problem}`)
      : null;
  const shownError = error ?? liveError;
  const isValid = Boolean(national) && !problem;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        className={cn(
          // One control, two parts: the country select and the number share a single
          // border and a single focus ring, so the pair does not read as two fields.
          'flex items-stretch rounded-2xl border border-slate-200 bg-slate-50 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800',
          shownError &&
            'border-rose-400 bg-rose-50/60 focus-within:border-rose-500 focus-within:ring-rose-400/30 dark:border-rose-800 dark:bg-rose-950/30',
          isValid &&
            !shownError &&
            'border-emerald-400 focus-within:border-emerald-500 focus-within:ring-emerald-400/25 dark:border-emerald-800',
        )}
      >
        <Select
          value={iso}
          onValueChange={(next) => {
            setIso(next);
            emit(next, national);
          }}
          disabled={disabled}
        >
          <SelectTrigger
            aria-label={t('countryLabel')}
            className="w-auto shrink-0 gap-1.5 rounded-2xl rounded-r-none border-0 border-r border-slate-200 bg-transparent px-3.5 py-3.5 text-xs font-bold focus-visible:ring-0 data-[state=open]:ring-0 dark:border-slate-700"
          >
            <SelectValue>
              <span className="text-base leading-none">{country.flag}</span>
              <span className="tabular-nums">+{country.dial}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {PHONE_COUNTRIES.map((c) => (
              <SelectItem key={c.iso} value={c.iso}>
                <span className="mr-1.5 text-base leading-none">{c.flag}</span>
                <span className="font-semibold">{t(`country.${c.iso}`)}</span>
                <span className="ml-1.5 tabular-nums text-slate-400">+{c.dial}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          disabled={disabled}
          value={formatNational(country, national)}
          onChange={(e) => emit(iso, e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={Boolean(shownError)}
          placeholder={formatNational(country, '0'.repeat(Math.min(...country.lengths))).replace(/0/g, '_')}
          className="min-w-0 flex-1 rounded-2xl rounded-l-none border-0 bg-transparent px-4 py-3.5 text-xs font-bold tracking-wide focus-visible:ring-0 dark:bg-transparent"
        />
      </div>

      {shownError ? (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <Icon name="AlertTriangle" size={12} />
          {shownError}
        </p>
      ) : isValid ? (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <Icon name="CheckCircle2" size={12} />
          {t('valid')}
        </p>
      ) : null}
    </div>
  );
}
