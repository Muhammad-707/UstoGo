'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Children, createContext, useContext, useMemo, type ReactNode } from 'react';

// Smooth, non-bouncy stagger: children fade/slide in one after another.
export const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

/** The whole wave finishes inside this, however many children there are. */
const MAX_TOTAL_STAGGER = 0.9;
const PREFERRED_STAGGER = 0.09;

/**
 * A per-child delay that shortens as the list grows.
 *
 * A flat 0.09s per child is fine for the eight cards on a landing row and catastrophic
 * for a long list: the admin review queue holds 306 items, so the last card began its
 * fade-in 27 seconds after the page loaded, and every card until then sat at
 * `opacity: 0`. The page looked empty and broken for half a minute. Capping the *total*
 * keeps the effect on short lists and makes it a quick ripple on long ones.
 */
function buildStagger(count: number): Variants {
  const step = count > 1 ? Math.min(PREFERRED_STAGGER, MAX_TOTAL_STAGGER / (count - 1)) : 0;
  return {
    hidden: {},
    show: { transition: { staggerChildren: step, delayChildren: 0.05 } },
  };
}

/**
 * Memoised on purpose: a fresh `variants` object on every render makes framer-motion
 * re-evaluate the whole variant tree, which restarts the entrance and leaves the
 * children pinned at `opacity: 0` for as long as the parent keeps re-rendering.
 */
function useStagger(count: number): Variants {
  return useMemo(() => buildStagger(count), [count]);
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Back-compat aliases used by filter controls.
export const filterContainerVariants = staggerContainerVariants;
export const filterItemVariants = staggerItemVariants;

const STAGGER_STEP = 0.1;
const ITEM_DURATION = 0.6;
const ITEM_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MAX_STAGGER_INDEX = 8;

/**
 * These animate on mount, not on scroll.
 *
 * They used to be `whileInView` with `viewport.once`, which is the wrong trigger for
 * this app: every list here is populated by a fetch, so the element the observer was
 * watching is created *after* the scroll position settled, and `once` means one missed
 * intersection leaves the content parked at `opacity: 0` forever. `FilterContainer`
 * tried to work around it by remounting on child count, which instead restarted the
 * wave every time a batch changed size — `/orders` shipped two real orders that were
 * in the DOM, styled `opacity: 0`, and invisible on screen. A reveal that can hide
 * real content is worse than no reveal, so the trigger is now mount.
 */

// Items inside a container (FilterContainer / AnimatedGrid) are driven by the
// container's single viewport trigger, so the whole group waves in order
// (1st card, 2nd, 3rd, ...) instead of each card firing its own event.
const StaggerContext = createContext(false);

function useStaggered(): boolean {
  return useContext(StaggerContext);
}

export function FilterContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  // Keyed on the child count so a batch that arrives *after* the container scrolled into
  // view still animates. `viewport.once` fires exactly once, and a container that was
  // empty at that moment — which is every list still waiting on its fetch — would leave
  // every later child parked at `hidden`, i.e. `opacity: 0`. That is why the marketplace
  // rendered a blank gap where its category chips should be: they were there, invisible.
  const count = Children.count(children);
  const stagger = useStagger(count);

  return (
    <StaggerContext.Provider value={true}>
      <motion.div
        key={count}
        initial="hidden"
        animate="show"
        variants={stagger}
        className={className}
      >
        {children}
      </motion.div>
    </StaggerContext.Provider>
  );
}

/**
 * Fades/slides in when it mounts. Inside a FilterContainer it participates in the
 * container's ordered wave; standalone, `index` staggers items that appear together,
 * clamped so a long list does not end with a card waiting a full second.
 */
export function FilterItem({
  index = 0,
  className,
  onClick,
  children,
}: {
  index?: number;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const staggered = useStaggered();
  if (staggered) {
    return (
      <motion.div variants={staggerItemVariants} onClick={onClick} className={className}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerItemVariants}
      transition={{ duration: ITEM_DURATION, ease: ITEM_EASE, delay: (index % MAX_STAGGER_INDEX) * STAGGER_STEP }}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FilterButton({
  index = 0,
  className,
  onClick,
  disabled,
  title,
  children,
}: {
  index?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}) {
  const staggered = useStaggered();
  const motionProps = staggered
    ? { variants: staggerItemVariants as Variants }
    : {
        initial: 'hidden' as const,
        animate: 'show' as const,
        variants: staggerItemVariants as Variants,
        transition: { duration: ITEM_DURATION, ease: ITEM_EASE, delay: (index % MAX_STAGGER_INDEX) * STAGGER_STEP },
      };
  return (
    <motion.button
      type="button"
      {...motionProps}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
    >
      {children}
    </motion.button>
  );
}

/**
 * Wraps a card grid/list so its contents smoothly cross-fade whenever `animKey`
 * changes (e.g. active filter, category, or view mode) instead of popping instantly.
 * The whole new batch waves in one after another via the container stagger.
 */
export function AnimatedGrid({
  animKey,
  className,
  children,
}: {
  animKey: string | number;
  className?: string;
  children: ReactNode;
}) {
  const count = Children.count(children);
  const stagger = useStagger(count);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animKey}
        initial="hidden"
        animate="show"
        variants={stagger}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
        className={className}
      >
        <StaggerContext.Provider value={true}>{children}</StaggerContext.Provider>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * A single card that fades/slides in when it mounts. Inside an AnimatedGrid it
 * participates in the container's ordered wave.
 */
const MotionTr = motion.create('tr');

/** Same stagger as AnimatedCard, but for a <tr> inside a <table>. */
export function InViewRow({
  index = 0,
  className,
  onClick,
  children,
}: {
  index?: number;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const staggered = useStaggered();
  if (staggered) {
    return (
      <MotionTr variants={staggerItemVariants} onClick={onClick} className={className}>
        {children}
      </MotionTr>
    );
  }
  return (
    <MotionTr
      initial="hidden"
      animate="show"
      variants={staggerItemVariants}
      transition={{ duration: ITEM_DURATION, ease: ITEM_EASE, delay: (index % MAX_STAGGER_INDEX) * STAGGER_STEP }}
      onClick={onClick}
      className={className}
    >
      {children}
    </MotionTr>
  );
}

export function AnimatedCard({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  const staggered = useStaggered();
  if (staggered) {
    return (
      <motion.div variants={staggerItemVariants} className={className}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerItemVariants}
      transition={{ duration: ITEM_DURATION, ease: ITEM_EASE, delay: (index % MAX_STAGGER_INDEX) * STAGGER_STEP }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
