import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serviceSections } from '@/lib/data/services';
import Link from 'next/link';
import ProviderList from '@/components/services/ProviderList';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Search Services • Briar Chapel Connect',
};

interface SearchPageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function ServicesSearchPage(props: SearchPageProps) {
  const { q } = (await props.searchParams) || {};
  const query = (q || '').trim();

  if (!query) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Search</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Type in the search box to find services and providers.</p>
        </div>
      </div>
    );
  }

  const lc = query.toLowerCase();

  // 1) Search service topics (static taxonomy)
  const topicHits = [];
  for (const section of serviceSections) {
    for (const item of section.items) {
      const hay = `${item.title} ${item.description}`.toLowerCase();
      if (hay.includes(lc)) {
        topicHits.push({
          href: `/services/${section.slug}/${item.slug}`,
          title: item.title,
          section: section.title,
          description: item.description,
        });
      }
    }
  }

  // 2) Search providers in Supabase
  const supabase = await createClient();
  type ServiceRow = Pick<
    Database['public']['Tables']['services']['Row'],
    'id' | 'title' | 'summary' | 'details' | 'website' | 'location' | 'category' | 'status' | 'image_url' | 'contact_phone'
  >;
  const { data: rows, error } = await supabase
    .from('services')
    .select('id, title, summary, details, website, location, category, status, image_url, contact_phone')
    .ilike('title', `%${query}%`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .returns<ServiceRow[]>();

  if (error) {
    console.error('Search providers error:', error.message);
  }

  // compute avg ratings for matched providers
  const serviceIds = (rows ?? []).map((r) => r.id);
  let avgByServiceId = new Map<string, { sum: number; count: number }>();
  if (serviceIds.length > 0) {
    type RatingRow = { service_id: string; rating: number };
    const { data: ratingsRows, error: ratingsError } = await supabase
      .from('service_reviews')
      .select('service_id, rating')
      .in('service_id', serviceIds)
      .returns<RatingRow[]>();
    if (!ratingsError && ratingsRows) {
      avgByServiceId = ratingsRows.reduce((map, row) => {
        const current = map.get(row.service_id) || { sum: 0, count: 0 };
        current.sum += Number(row.rating || 0);
        current.count += 1;
        map.set(row.service_id, current);
        return map;
      }, new Map<string, { sum: number; count: number }>());
    }
  }

  const providers =
    (rows ?? []).map((r) => {
      const stats = avgByServiceId.get(r.id);
      const rating = stats && stats.count > 0 ? stats.sum / stats.count : 0;
      return {
        id: r.id,
        name: r.title,
        summary: r.summary ?? undefined,
        details: r.details ?? undefined,
        imageUrl: r.image_url ?? undefined,
        website: r.website ?? undefined,
        phone: r.contact_phone ?? undefined,
        rating,
        reviewCount: stats?.count ?? 0,
      };
    }) ?? [];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Search results for “{query}”</h1>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Service Topics</h2>
          {topicHits.length > 0 ? (
            <ul className="mt-3 grid gap-3">
              {topicHits.map((hit, i) => (
                <li key={`${hit.href}-${i}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                  <Link href={hit.href} className="text-blue-600 hover:underline dark:text-blue-400">
                    {hit.title}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">{hit.section}</div>
                  <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">{hit.description}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No matching topics found.</p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Providers</h2>
          <div className="mt-3">
            <ProviderList providers={providers} />
          </div>
        </section>
      </div>
    </div>
  );
}


