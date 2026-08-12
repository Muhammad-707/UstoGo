'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ru, enUS } from 'date-fns/locale';
import { Icon } from '@/components/icons/LucideIcons';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * The date field of the product.
 *
 * `<input type="date">` renders the browser's own calendar — grey, in the OS
 * language, unstyleable — which is why booking dates looked nothing like the rest
 * of the app. This is the shadcn Calendar in a Popover instead: same field skin as
 * every other input, the site's own language, and the disabled range enforced by
 * `min`/`max` instead of only on submit.
 *
 * The value stays a `yyyy-MM-dd` string so every caller that talks to the API in
 * that shape keeps working unchanged.
 */

/** `tj` is not a date-fns locale (and Tajik is written in Cyrillic here), so it borrows `ru`. */
const DATE_LOCALES = { tj: ru, ru, en: enUS } as const;

function toISODate(date: Date): string {
  // Local calendar day, not UTC — `toISOString` would shift the date east of UTC.
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Today in the visitor's own calendar, `yyyy-MM-dd`.
 *
 * `new Date().toISOString().slice(0, 10)` is UTC, and Dushanbe is UTC+5: between
 * midnight and 5am local it hands back *yesterday*, which had the booking wizard
 * opening on a past date and `min` happily allowing it.
 */
export function todayISO(): string {
  return toISODate(new Date());
}

function fromISODate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export interface DatePickerProps {
  /** `yyyy-MM-dd`, the shape the API speaks. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable day, `yyyy-MM-dd`. */
  min?: string;
  /** Latest selectable day, `yyyy-MM-dd`. */
  max?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Shown under the trigger for the "no date yet" state. */
  'aria-label'?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  id,
  placeholder,
  disabled,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const t = useTranslations('common');
  const locale = useLocale() as keyof typeof DATE_LOCALES;
  const dateLocale = DATE_LOCALES[locale] ?? enUS;
  const [open, setOpen] = React.useState(false);

  const selected = fromISODate(value);
  const minDate = fromISODate(min);
  const maxDate = fromISODate(max);

  const label = selected
    ? selected.toLocaleDateString(locale === 'tj' ? 'tg-TJ' : locale === 'ru' ? 'ru-RU' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : placeholder ?? t('selectDate');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="ghost"
          size="raw"
          disabled={disabled}
          aria-label={ariaLabel}
          // Deliberately the Input/SelectTrigger skin, so a date sitting next to a
          // text field or a select is visibly the same kind of control.
          className={cn(
            'w-full justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-900 transition-colors',
            'hover:border-slate-300 hover:bg-slate-50 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20',
            'data-[state=open]:border-blue-500 data-[state=open]:ring-2 data-[state=open]:ring-blue-500/20',
            'disabled:cursor-not-allowed disabled:opacity-60',
            'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600 dark:hover:bg-slate-800',
            !selected && 'text-slate-400 font-medium dark:text-slate-500',
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <Icon name="Calendar" size={15} className="shrink-0 text-slate-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={8} className="w-auto rounded-2xl p-2">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? minDate}
          locale={dateLocale}
          weekStartsOn={1}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          onSelect={(date) => {
            if (!date) return;
            onChange(toISODate(date));
            setOpen(false);
          }}
          formatters={{
            // Russian and Tajik month names arrive lowercase from the locale; a
            // caption reading "август 2026" looks like a bug next to everything
            // else on the page being title-cased.
            formatCaption: (month) => {
              const label = month.toLocaleString(dateLocale.code, { month: 'long', year: 'numeric' });
              return label.charAt(0).toUpperCase() + label.slice(1);
            },
          }}
          className={cn(
            '[--cell-size:--spacing(9)] [--cell-radius:var(--radius-xl)]',
            // Softer, larger hit areas than the stock density, and the weekday row
            // set small and quiet so the numbers carry the grid.
            '[&_thead_th]:text-[10px] [&_thead_th]:font-bold [&_thead_th]:uppercase [&_thead_th]:tracking-wide',
            '[&_button]:font-semibold',
          )}
        />
      </PopoverContent>
    </Popover>
  );
}
