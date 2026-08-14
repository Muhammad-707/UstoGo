'use client';

import React, { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

export interface CountUpProps {
  /** The number to land on. */
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Seconds. */
  duration?: number;
  className?: string;
}

function formatter(decimals: number) {
  // en-US grouping on purpose: the figure reads "50,000+" in every locale of this app,
  // and `tj` is not a tag Intl knows, so asking it for the page locale would throw.
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * A figure that counts up from zero the first time it scrolls into view.
 *
 * Two things worth knowing about how this is wired:
 *
 * 1. The final value is what renders on the server and on first paint. The animation
 *    only ever *replaces* a correct number with a correct number, so if JS is off, the
 *    observer never fires, or the element mounts already past the viewport, the reader
 *    still sees 50,000+ rather than a permanent 0. A reveal that can hide real content
 *    is worse than no reveal.
 *
 * 2. The tween writes straight to `textContent` instead of going through state. At 60fps
 *    over 1.8s that would otherwise be ~110 React renders per figure, four figures deep,
 *    for text that no other component reads.
 */
export function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1.8, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduceMotion) return;

    const fmt = formatter(decimals);
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${prefix}${fmt.format(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduceMotion, to, decimals, prefix, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {`${prefix}${formatter(decimals).format(to)}${suffix}`}
    </span>
  );
}

export default CountUp;
