import type { Category } from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function flattenCategories(categories: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (list: Category[]) => {
    for (const c of list) {
      out.push(c);
      if (c.children?.length) walk(c.children);
    }
  };
  walk(categories);
  return out;
}

/**
 * The backend filters masters by category UUID. Some UI links use slugs
 * (e.g. HeroSlider tags), so resolve those to ids; 'all'/undefined = no filter.
 */
export function resolveCategoryId(
  input: string | null | undefined,
  categories: Category[]
): string | undefined {
  if (!input || input === 'all') return undefined;
  if (UUID_RE.test(input)) return input;
  const slug = decodeURIComponent(input).toLowerCase();
  return flattenCategories(categories).find((c) => c.slug.toLowerCase() === slug)?.id;
}
