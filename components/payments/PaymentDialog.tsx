'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CardBrandMark } from '@/components/payments/CardBrandMark';
import {
  MAX_CARD_DIGITS,
  PAYMENT_METHODS,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  schemeOf,
  validateCard,
  type CardField,
  type CardFormValues,
  type PaymentMethod,
} from '@/lib/payments/cards';

export interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already formatted for the reader's locale — "300,00 сомонӣ". */
  amountLabel: string;
  /**
   * What the payment is *for*: runs once the card has cleared, and owns the real side
   * effect (creating the booking). Throwing shows the failure inside the dialog with the
   * card still filled in, so the reader can retry rather than restart.
   */
  onConfirmed: () => Promise<void>;
  /** One line under the title — what is being paid for. */
  summary?: string;
}

type Stage = 'method' | 'card' | 'processing' | 'success' | 'failed';

const EMPTY_CARD: CardFormValues = { number: '', holder: '', expiry: '', cvv: '' };

/** How long the authorisation animation runs. Long enough to read, short enough to trust. */
const PROCESSING_MS = 1500;

/**
 * Compact field skin. The whole sheet has to fit a laptop screen without scrolling, so
 * every control here is one step tighter than the app's default form field.
 */
const FIELD =
  'w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-[13px] font-bold tracking-wide text-slate-900 dark:text-white transition focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20';
const FIELD_INVALID =
  'border-rose-400 bg-rose-50/70 focus-visible:border-rose-500 focus-visible:ring-rose-400/30 dark:border-rose-800 dark:bg-rose-950/30';

function Row({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          <Icon name="AlertTriangle" size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The checkout sheet: pick a card, enter it, watch it clear.
 *
 * There is no acquirer behind this dialog. The authorisation is a timer, the card number
 * never leaves the browser and is never stored, and the only real side effect is
 * `onConfirmed`. It is built to the shape of a real payment — brand grid, card form,
 * authorisation, receipt — so that wiring a processor in later is a change to one
 * function rather than a redesign. Browser autofill is switched off throughout: nothing
 * here should ever be handed a real card.
 */
export function PaymentDialog({ open, onOpenChange, amountLabel, onConfirmed, summary }: PaymentDialogProps) {
  // `checkout`, not `payments` — the latter is the earnings screen's namespace.
  const t = useTranslations('checkout');

  const [stage, setStage] = useState<Stage>('method');
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [card, setCard] = useState<CardFormValues>(EMPTY_CARD);
  const [errors, setErrors] = useState<Partial<Record<CardField, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

  // Every opening starts at the brand grid with an empty card — a checkout that
  // remembers a half-typed card from the last attempt is unsettling, not helpful.
  // Adjusted during render rather than in an effect, so the reset is already true in the
  // first frame of the open dialog.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStage('method');
      setCard(EMPTY_CARD);
      setErrors({});
      setFailure(null);
    }
  }

  const scheme = schemeOf(card.number);
  const cardMessages = useMemo(
    () => ({
      numberRequired: t('vNumberRequired'),
      numberShort: t('vNumberShort'),
      holderRequired: t('vHolderRequired'),
      expiryIncomplete: t('vExpiryIncomplete'),
      expiryMonth: t('vExpiryMonth'),
      expiryExpired: t('vExpiryExpired'),
      cvvInvalid: t('vCvvInvalid'),
    }),
    [t],
  );

  const set = (field: CardField, value: string) => {
    setCard((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const pay = async () => {
    const found = validateCard(card, cardMessages);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStage('processing');
    setFailure(null);
    await new Promise((resolve) => setTimeout(resolve, PROCESSING_MS));

    try {
      await onConfirmed();
      setStage('success');
      setTimeout(() => onOpenChange(false), 1100);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : t('failedGeneric'));
      setStage('failed');
    }
  };

  const busy = stage === 'processing' || stage === 'success';
  const previewNumber = formatCardNumber(card.number) || '•••• •••• •••• ••••';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return; // never let the sheet vanish mid-authorisation
        onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={!busy} className="gap-3 p-5 sm:max-w-[430px] sm:p-6">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon name="creditcard" size={17} className="text-blue-600 dark:text-sky-400" />
            {t('title')}
          </DialogTitle>
          {summary && <DialogDescription className="truncate">{summary}</DialogDescription>}
        </DialogHeader>

        {/* The amount, always visible — a checkout that hides the total while asking for
            a card is the oldest dark pattern there is. */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            {t('amountLabel')}
          </span>
          <span className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">{amountLabel}</span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {stage === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {t('chooseMethod')}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {PAYMENT_METHODS.map((m) => (
                  <Button
                    key={m.id}
                    size="raw"
                    variant="unstyled"
                    type="button"
                    onClick={() => {
                      setMethod(m);
                      setStage('card');
                    }}
                    className={cn(
                      'flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-800',
                      method.id === m.id && 'border-blue-500 ring-2 ring-blue-500/20 dark:border-sky-600',
                    )}
                  >
                    <span className="h-8 w-[52px] shrink-0 overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
                      <CardBrandMark brand={m.brand} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-extrabold leading-tight text-slate-900 dark:text-white">
                        {m.name}
                      </span>
                      <span className="block truncate text-[10px] font-semibold text-slate-400">{t(m.kindKey)}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {(stage === 'card' || stage === 'failed') && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >
              {/* A real form, so Enter pays — and `autoComplete="off"` at the form level,
                  because Chrome offers saved cards to anything shaped like a checkout and
                  warns loudly about it over plain http. Nothing here should ever be
                  handed a real card. */}
              <form
                className="space-y-3"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  void pay();
                }}
              >
                {/* The card, drawn as it is filled in — the fastest way to spot a digit
                    typed into the wrong field. */}
                <div
                  className={cn(
                    'relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg',
                    method.gradient,
                  )}
                >
                  <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-14 -left-8 h-32 w-32 rounded-full bg-black/15 blur-2xl" />

                  <div className="relative flex items-start justify-between gap-3">
                    <span className="h-7 w-[46px] overflow-hidden rounded-md shadow-sm ring-1 ring-white/25">
                      <CardBrandMark brand={method.brand} />
                    </span>
                    {/* The scheme the number itself belongs to, once it is recognisable —
                        skipped when it would simply repeat the chosen brand. */}
                    {scheme !== 'UNKNOWN' && scheme !== method.brand && (
                      <span className="h-7 w-[46px] overflow-hidden rounded-md shadow-sm ring-1 ring-white/25">
                        <CardBrandMark brand={scheme} />
                      </span>
                    )}
                  </div>

                  <div className="relative mt-3 h-6 w-8 rounded bg-gradient-to-br from-amber-200 to-amber-400 shadow-inner" />

                  <p className="relative mt-3 font-mono text-[15px] font-bold tracking-[0.12em] tabular-nums">
                    {previewNumber}
                  </p>

                  <div className="relative mt-2.5 flex items-end justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.1em]">
                    <span className="min-w-0 truncate opacity-90">{card.holder || t('holderPlaceholder')}</span>
                    <span className="shrink-0 tabular-nums opacity-90">{formatExpiry(card.expiry) || 'MM/YY'}</span>
                  </div>
                </div>

                <Row label={t('numberLabel')} error={errors.number}>
                  <Input
                    name="ug-card-ref"
                    inputMode="numeric"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    value={formatCardNumber(card.number)}
                    onChange={(e) => set('number', digitsOnly(e.target.value).slice(0, MAX_CARD_DIGITS))}
                    placeholder="0000 0000 0000 0000"
                    aria-invalid={Boolean(errors.number)}
                    className={cn(FIELD, 'font-mono', errors.number && FIELD_INVALID)}
                  />
                </Row>

                <Row label={t('holderLabel')} error={errors.holder}>
                  <Input
                    name="ug-card-owner"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    value={card.holder}
                    onChange={(e) => set('holder', e.target.value.toUpperCase())}
                    placeholder={t('holderPlaceholder')}
                    aria-invalid={Boolean(errors.holder)}
                    className={cn(FIELD, 'uppercase', errors.holder && FIELD_INVALID)}
                  />
                </Row>

                <div className="grid grid-cols-2 gap-3">
                  <Row label={t('expiryLabel')} error={errors.expiry}>
                    <Input
                      name="ug-card-until"
                      inputMode="numeric"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      value={formatExpiry(card.expiry)}
                      onChange={(e) => set('expiry', digitsOnly(e.target.value).slice(0, 4))}
                      placeholder="MM/YY"
                      aria-invalid={Boolean(errors.expiry)}
                      className={cn(FIELD, 'font-mono', errors.expiry && FIELD_INVALID)}
                    />
                  </Row>
                  <Row label={t('cvvLabel')} error={errors.cvv}>
                    <Input
                      name="ug-card-code"
                      inputMode="numeric"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      value={card.cvv}
                      onChange={(e) => set('cvv', digitsOnly(e.target.value).slice(0, 4))}
                      placeholder="000"
                      aria-invalid={Boolean(errors.cvv)}
                      className={cn(FIELD, 'font-mono', errors.cvv && FIELD_INVALID)}
                    />
                  </Row>
                </div>

                {failure && (
                  <p className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                    <Icon name="AlertTriangle" size={13} />
                    {failure}
                  </p>
                )}

                <div className="flex items-center gap-2.5 pt-0.5">
                  <Button
                    size="raw"
                    variant="ghost"
                    type="button"
                    onClick={() => setStage('method')}
                    className="shrink-0 rounded-xl border border-slate-200 px-3.5 py-3 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    {t('changeMethod')}
                  </Button>
                  <Button
                    size="raw"
                    variant="unstyled"
                    type="submit"
                    className="btn-ripple flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
                  >
                    <Icon name="lock" size={13} />
                    {t('payAction', { amount: amountLabel })}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {stage === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3.5 py-10"
            >
              <div className="h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-sky-400" />
              <div className="space-y-1 text-center">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{t('processingTitle')}</p>
                <p className="text-xs text-slate-500">{t('processingDesc')}</p>
              </div>
            </motion.div>
          )}

          {stage === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3.5 py-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              >
                <Icon name="CheckCircle2" size={34} />
              </motion.div>
              <div className="space-y-1 text-center">
                <p className="text-base font-extrabold text-slate-900 dark:text-white">{t('successTitle')}</p>
                <p className="text-xs text-slate-500">{t('successDesc', { amount: amountLabel })}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
