import { redirect } from 'next/navigation';

/**
 * The leaderboard moved into `/reviews` as a tab — the navbar had grown to nine links
 * and these two were the same subject twice. Kept as a redirect so existing links,
 * bookmarks and the sitemap's old entry all still land somewhere real.
 */
export default function LeaderboardPage() {
  redirect('/reviews?tab=leaderboard');
}
