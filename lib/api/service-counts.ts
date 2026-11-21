import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * How many active providers each service type has, keyed by the composite
 * `category` string (`"<section-slug>/<service-slug>"`).
 *
 * Read with the anon client: active providers are public. Wrapped in
 * React's `cache()` so the services layout and the page inside it share one
 * query per request. A failure logs and returns an empty map, which shows
 * every type as having no providers rather than breaking the page.
 */
export const providerCounts = cache(async (): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('category')
    .eq('status', 'active')
    .returns<{ category: string }[]>();
  if (error) {
    console.error('[Services] provider count error:', error.message);
    return counts;
  }
  for (const { category } of data ?? []) counts.set(category, (counts.get(category) ?? 0) + 1);
  return counts;
});

/** Total providers across a section's service types. */
export function sectionCount(counts: Map<string, number>, sectionSlug: string): number {
  let total = 0;
  for (const [category, n] of counts) {
    if (category.startsWith(`${sectionSlug}/`)) total += n;
  }
  return total;
}
