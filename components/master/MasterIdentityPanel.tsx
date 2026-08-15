'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Award, Clock, MapPin, ShieldCheck, Star, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Switch } from '@/components/ui/switch';
import { MASTER_CABINET_IMAGES, getAvatarUrl } from '@/lib/placeholders';
import { cn } from '@/lib/utils';
import type { MasterProfile, MasterStatus } from '@/lib/api/types';

/** One fact about the master, as a chip that sits on the photograph in either theme. */
function Meta({
  Icon,
  children,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold backdrop-blur-md',
        'border border-slate-900/10 bg-white/75 text-slate-700',
        'dark:border-white/20 dark:bg-white/10 dark:text-white',
      )}
    >
      <Icon size={13} className="shrink-0 text-blue-600 dark:text-sky-300" />
      {children}
    </span>
  );
}

/**
 * One switch and its label, as a full-width row.
 *
 * Deliberately not two side-by-side columns: "Приём заказов" and "Мгновенное
 * бронирование" are long enough that a half-width cell truncated both to "Приём з…" —
 * a control whose label you cannot read is a control you cannot use.
 */
function ToggleRow({
  Icon,
  label,
  state,
  checked,
  onChange,
  disabled,
  title,
  on,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  state: string;
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
  title?: string;
  on: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
          checked
            ? 'bg-blue-600/10 text-blue-700 dark:bg-white/20 dark:text-white'
            : 'bg-slate-900/[0.06] text-slate-400 dark:bg-white/5 dark:text-slate-400',
        )}
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{label}</p>
        <p
          className={cn(
            'text-[11.5px]',
            checked ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400',
          )}
        >
          {state}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={title ?? label}
        title={title}
        className={cn('shrink-0', on)}
      />
    </div>
  );
}

interface MasterIdentityPanelProps {
  profile: MasterProfile;
  avatarUrl: string | null;
  cityName?: string;
  status: MasterStatus | null;
  togglingActive: boolean;
  togglingInstantBook: boolean;
  onToggleActive: () => void;
  onToggleInstantBook: () => void;
  className?: string;
}

/**
 * Who you are, whether you are open, and how reliable you are — on the same photographed
 * band the client feed opens on.
 *
 * The cabinet used to open on a flat white strip while the public pages opened on a
 * photograph, which is what made signing in feel like leaving the product. This is the
 * feed's welcome panel in the master's own terms.
 *
 * It follows the theme rather than staying dark in both, which is what it used to do.
 * "A photograph needs a dark scrim" is true of *one* photograph — the fix is a second
 * frame, not a permanently black band sitting in the middle of a white page. Light mode
 * gets the daylight shot under a white scrim with dark type; dark mode gets the dusk
 * shot under the old one. Every colour below is stated for both themes for that reason.
 */
export function MasterIdentityPanel({
  profile,
  avatarUrl,
  cityName,
  status,
  togglingActive,
  togglingInstantBook,
  onToggleActive,
  onToggleInstantBook,
  className,
}: MasterIdentityPanelProps) {
  const t = useTranslations('dashboardMaster');
  const approved = profile.approvalStatus === 'APPROVED';
  const reliability =
    status?.reliabilityScore !== null && status?.reliabilityScore !== undefined
      ? Number(status.reliabilityScore)
      : null;

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-[2rem] border shadow-xl',
        'border-slate-200/80 bg-white shadow-slate-900/[0.06]',
        'dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/40',
        className,
      )}
    >
      {/* Full bleed, not a half-panel inset. Feathering the photograph into the right
          half sounded restrained and looked like a smudge: half a picture, cropped
          through someone's face, dissolving into white. A photograph either carries the
          band or it should not be there — so it carries it, and two scrims (one across,
          one down) buy back the contrast the text needs, in whichever direction the
          theme needs it. */}
      <img
        src={MASTER_CABINET_IMAGES.heroLight}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover dark:hidden"
      />
      <img
        src={MASTER_CABINET_IMAGES.heroDark}
        alt=""
        aria-hidden
        className="absolute inset-0 hidden h-full w-full object-cover dark:block"
      />

      {/* An even veil, not a gradient that eats one half of the frame. The type sits on
          glass panels of its own below, which is what buys back the contrast — so the
          photograph gets to be a photograph across the whole band instead of dissolving
          into the left edge. */}
      <div aria-hidden className="absolute inset-0 bg-white/25 dark:bg-slate-950/45" />

      {/* The two glows that carry the brand across both themes — weak enough in light
          mode to read as a tint on white rather than as a second colour. */}
      <div
        aria-hidden
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl dark:bg-blue-600/30"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-600/20"
      />
      <div
        aria-hidden
        className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent dark:via-sky-400/50"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between lg:gap-8">

        {/* Who — on its own glass panel, matching the control block opposite it. */}
        <div
          className={cn(
            'flex min-w-0 items-center gap-4 rounded-3xl border px-4 py-4 backdrop-blur-xl sm:px-5',
            'border-white/70 bg-white/70 shadow-lg shadow-slate-900/5',
            'dark:border-white/15 dark:bg-slate-950/55 dark:shadow-none',
          )}
        >
          <div className="relative shrink-0">
            <span
              aria-hidden
              className="absolute -inset-1 rounded-[1.4rem] bg-gradient-to-br from-blue-500 to-sky-400 opacity-60 blur dark:opacity-70"
            />
            <img
              src={avatarUrl ?? getAvatarUrl(profile.id, profile.displayName)}
              alt={profile.displayName}
              className="relative h-16 w-16 rounded-2xl border-2 border-white/80 object-cover dark:border-white/25"
            />
            {approved && (
              <span
                title={t('verifiedMaster')}
                className="absolute -bottom-1.5 -right-1.5 rounded-full bg-blue-600 p-1 text-white ring-2 ring-white dark:ring-slate-950"
              >
                <ShieldCheck size={12} />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50/90 px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-widest text-blue-700 backdrop-blur-md dark:border-blue-400/40 dark:bg-blue-500/25 dark:text-blue-100">
              {t('badge')}
            </span>
            <Link
              href={`/master/${profile.id}`}
              title={t('viewPublicProfile')}
              className="group mt-1.5 flex min-w-0 items-center gap-1.5"
            >
              <h2 className="truncate text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[28px] dark:text-white dark:drop-shadow-sm">
                {profile.displayName}
              </h2>
              <ArrowUpRight
                size={18}
                className="shrink-0 text-slate-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-sky-300"
              />
            </Link>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Meta Icon={MapPin}>{cityName ?? '—'}</Meta>
              <Meta Icon={Star}>
                {profile.ratingAverage}
                <span className="text-slate-400">({profile.ratingCount})</span>
              </Meta>
              {profile.yearsOfExperience > 0 && (
                <Meta Icon={Award}>{t('yearsExperience', { count: profile.yearsOfExperience })}</Meta>
              )}
            </div>
          </div>
        </div>

        {/* Reliability and the two switches, as one control block. */}
        <div
          className={cn(
            'w-full shrink-0 overflow-hidden rounded-3xl border backdrop-blur-xl lg:w-[340px]',
            'divide-y divide-slate-900/[0.07] border-slate-200/90 bg-white/80 shadow-lg shadow-slate-900/5',
            'dark:divide-white/10 dark:border-white/15 dark:bg-slate-950/55 dark:shadow-none',
          )}
        >
          {approved && reliability !== null && (
            <div className="px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-300">
                  {t('reliabilityScoreTitle')}
                </p>
                <p className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {reliability.toFixed(0)}%
                </p>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-[width] duration-700 dark:from-sky-400 dark:to-emerald-400"
                  style={{ width: `${Math.min(reliability, 100)}%` }}
                />
              </div>
            </div>
          )}

          {approved ? (
            <div className="divide-y divide-slate-900/[0.07] dark:divide-white/10">
              <ToggleRow
                Icon={Zap}
                label={t('availabilityLabel')}
                state={profile.isActive ? t('statusActive') : t('statusInactive')}
                checked={profile.isActive}
                onChange={onToggleActive}
                disabled={togglingActive}
                title={t('toggleAvailabilityHint')}
                on="data-checked:bg-emerald-500"
              />
              {status && (
                <ToggleRow
                  Icon={Clock}
                  label={t('instantBookTitle')}
                  state={status.instantBookEnabled ? t('statusActive') : t('statusInactive')}
                  checked={status.instantBookEnabled}
                  onChange={onToggleInstantBook}
                  disabled={togglingInstantBook}
                  on="data-checked:bg-blue-600"
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-4 text-[13px] font-bold text-amber-700 dark:text-amber-300">
              <Clock size={15} />
              {profile.approvalStatus === 'REJECTED' ? t('statusRejected') : t('statusPending')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MasterIdentityPanel;
