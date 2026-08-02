import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

const ALLOWED_TAGS = new Set(['masters']);

export async function POST(request: Request) {
  let tags: unknown;
  try {
    ({ tags } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ error: 'tags must be a non-empty array' }, { status: 400 });
  }

  const valid = tags.filter((tag): tag is string => typeof tag === 'string' && ALLOWED_TAGS.has(tag));
  for (const tag of valid) {
    revalidateTag(tag, 'max');
  }

  return NextResponse.json({ revalidated: valid });
}
