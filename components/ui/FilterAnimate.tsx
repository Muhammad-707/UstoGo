'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Children, createContext, useContext, type ReactNode } from 'react';

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

const VIEWPORT = { once: true, amount: 'some', margin: '0px 0px -40px 0px' } as const;

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

  return (
    <StaggerContext.Provider value={true}>
      <motion.div
        key={count}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        variants={staggerContainerVariants}
        className={className}
      >
        {children}
      </motion.div>
    </StaggerContext.Provider>
  );
}

/**
 * Fades/slides in the moment it scrolls into view (not on page mount), and only once.
 * Inside a FilterContainer it participates in the container's ordered wave.
 * Standalone, `index` staggers items that become visible together; the delay is
 * clamped so long lists never freeze cards off-screen.
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
      whileInView="show"
      viewport={VIEWPORT}
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
        whileInView: 'show' as const,
        viewport: VIEWPORT,
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
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animKey}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        variants={staggerContainerVariants}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
        className={className}
      >
        <StaggerContext.Provider value={true}>{children}</StaggerContext.Provider>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * A single card that fades/slides in the moment it scrolls into view, once.
 * Inside an AnimatedGrid it participates in the container's ordered wave.
 */
const MotionTr = motion.create('tr');

/** Same scroll-in stagger as AnimatedCard, but for a <tr> inside a <table>. */
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
      whileInView="show"
      viewport={VIEWPORT}
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
      whileInView="show"
      viewport={VIEWPORT}
      variants={staggerItemVariants}
      transition={{ duration: ITEM_DURATION, ease: ITEM_EASE, delay: (index % MAX_STAGGER_INDEX) * STAGGER_STEP }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
