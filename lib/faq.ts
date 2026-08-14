/**
 * The question set behind `/faq`, and the single place its length is written down.
 *
 * The page and the FAQPage structured data both need to know which `q*`/`a*` keys exist.
 * They used to each carry their own literal `[1, 2, 3, 4]`, which meant adding a question
 * in one place silently left it out of the other — Google would index a shorter FAQ than
 * the one on screen, and nothing would ever fail to warn about it.
 *
 * The answers themselves describe what the platform actually does. An earlier version
 * promised escrow-held payments, free cancellation two hours out, and a 1,000,000 TJS
 * guarantee; UstoGo processes no payments at all (ADR-8 — the client records what they
 * paid the master directly), a booking may be moved once and no later than 24h before its
 * slot, and cancelling inside three hours is recorded as a late cancellation. Answers a
 * reader can act on have to match the rules the API enforces.
 */
export interface FaqGroup {
  /** Catalogue key for the group heading, under the `faq` namespace. */
  labelKey: string;
  /** Icon name understood by `components/icons/LucideIcons`. */
  icon: string;
  /** 1-based question numbers, matching `q{n}` / `a{n}` in each locale's `faq.json`. */
  questions: number[];
}

export const FAQ_GROUPS: readonly FaqGroup[] = [
  { labelKey: 'groupBooking', icon: 'calendar', questions: [1, 2, 3] },
  { labelKey: 'groupPayment', icon: 'dollarsign', questions: [4, 5, 6] },
  { labelKey: 'groupMasters', icon: 'shieldcheck', questions: [7, 8] },
  { labelKey: 'groupShop', icon: 'shoppingbag', questions: [9, 10] },
];

/** Every question number, in the order the page renders them. */
export const FAQ_QUESTION_NUMBERS: readonly number[] = FAQ_GROUPS.flatMap((g) => g.questions);
