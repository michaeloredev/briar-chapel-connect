import { clerkClient } from '@clerk/nextjs/server';

/**
 * Display names for users, keyed by Clerk user ID.
 *
 * Resolved from Clerk on read rather than stored on the row, so existing
 * comments get names too and a rename shows up everywhere. Callers include
 * endpoints and pages open to signed-out visitors, so the fallback stops at
 * the person's name -- never their email address. A Clerk failure degrades to
 * unnamed entries rather than failing the whole page.
 */
export async function authorNames(userIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return names;

  try {
    const client = await clerkClient();
    // getUserList caps both the id filter and the page at 100.
    for (let i = 0; i < unique.length; i += 100) {
      const batch = unique.slice(i, i + 100);
      const { data: users } = await client.users.getUserList({ userId: batch, limit: batch.length });
      for (const u of users) {
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
        const name = u.username || fullName;
        if (name) names.set(u.id, name);
      }
    }
  } catch (err) {
    console.error('[UserNames] lookup error:', err instanceof Error ? err.message : err);
  }
  return names;
}
