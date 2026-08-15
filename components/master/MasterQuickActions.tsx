'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';

import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { cn } from '@/lib/utils';

export interface MasterQuickAction {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  /** Gradient classes for the icon chip — the same set the client feed's tiles use. */
  tile: string;
  /** Photograph behind the tile. */
  image: string;
}

/**
 * The four screens a master actually opens, as photographs rather than as a row of
 * grey boxes.
 *
 * The cabinet's shortcuts were four white cards with a coloured glyph — correct, and
 * completely silent. The client feed sells its categories with a picture of the finished
 * room; a master's own tools deserve the same treatment, and it costs nothing but the
 * image that was already in the library. The first tile is deliberately wider: a row of
 * four identical rectangles reads as a table, a 2-1-1-1 rhythm reads as a layout.
 */
export function MasterQuickActions({ actions }: { actions: MasterQuickAction[] }) {
  return (
    <FilterContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {actions.map((a, idx) => (
        <FilterItem key={a.href} index={idx} className={cn('h-full', idx === 0 && 'lg:col-span-2')}>
          <motion.div
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="h-full"
          >
            <Link
              href={a.href}
              className="group relative flex h-[200px] flex-col justify-end overflow-hidden rounded-3xl shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-shadow duration-300 hover:shadow-[0_28px_56px_-28px_rgba(15,23,42,0.45)]"
            >
              <img
                src={a.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
              />
              {/* Bottom-weighted, so the photograph stays bright while the caption keeps
                  something solid to sit on. */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-950/45 to-slate-950/10" />

              <span
                className={cn(
                  'absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
                  a.tile,
                )}
              >
                <a.Icon size={20} strokeWidth={2.2} />
              </span>

              <span className="absolute right-4 top-4 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white/95 text-slate-800 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <ArrowUpRight size={17} strokeWidth={2.5} />
              </span>

              <div className="relative p-5">
                <h3 className="text-base font-extrabold tracking-tight text-white">{a.label}</h3>
                <p className="mt-1 text-[11.5px] leading-relaxed text-white/70">{a.description}</p>
              </div>
            </Link>
          </motion.div>
        </FilterItem>
      ))}
    </FilterContainer>
  );
}

export default MasterQuickActions;
