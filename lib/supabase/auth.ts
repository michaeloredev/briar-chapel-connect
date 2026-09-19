import { auth } from '@clerk/nextjs/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './server';
import type { Database } from './types';

type AuthenticatedSupabase = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

/**
 * Returns an authenticated Supabase client for API routes using the current Clerk session.
 * Throws an Error('Unauthorized') if no user or session token is available.
 */
export async function requireAuthSupabase(): Promise<AuthenticatedSupabase> {
  const { userId, getToken } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const sessionToken = await getToken();
  if (!sessionToken) {
    throw new Error('Unauthorized');
  }
  const supabase = await createClient(sessionToken);
  return { supabase, userId };
}


