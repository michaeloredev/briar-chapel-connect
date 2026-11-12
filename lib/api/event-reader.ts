import { auth } from '@clerk/nextjs/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRole, hasRole } from '@/lib/auth/roles';

/**
 * The client to read events (and their comment threads) with, for whoever is
 * asking. Events of a private group are members-only under RLS, so a
 * signed-in user reads with their own token and sees their groups' events;
 * signed out, the anon client sees only public ones. Site admins moderate
 * every group, so they read through the service role and see everything.
 */
export async function eventsReader(): Promise<SupabaseClient<Database>> {
  const { userId, getToken } = await auth();
  if (userId && hasRole(await getUserRole(userId), 'admin')) return createAdminClient();
  return createClient((userId && (await getToken())) || undefined);
}
