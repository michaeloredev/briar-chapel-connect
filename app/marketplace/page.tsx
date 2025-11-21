import type { Metadata } from 'next';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { PageHeader } from '@/components/common/PageHeader';
import { AddMarketplaceItemButton } from '@/components/ui/AddMarketplaceItem';
import MarketplaceItemCard from '@/components/marketplace/MarketplaceItemCard';
import MarketplaceSearch from '@/components/marketplace/MarketplaceSearch';

export const metadata: Metadata = {
  title: 'Marketplace • Briar Chapel Connect',
  description: 'Browse items for sale in Briar Chapel',
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  min?: string;
  max?: string;
}>;

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const { q = '', category = '', condition = '', min = '', max = '' } = await searchParams;

  const supabase = await createClient();
  type Row = Database['public']['Tables']['marketplace_items']['Row'];
  let query = supabase
    .from('marketplace_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (q) {
    // Search title OR description
    const escaped = q.replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (condition) {
    query = query.eq('condition', condition);
  }
  const minNum = Number(min);
  const maxNum = Number(max);
  if (Number.isFinite(minNum)) {
    query = query.gte('price', minNum);
  }
  if (Number.isFinite(maxNum) && maxNum > 0) {
    query = query.lte('price', maxNum);
  }

  const { data: items, error } = await query.returns<Row[]>();
  if (error) {
    // Non-fatal: show empty with error text
    console.error('Marketplace query error:', error.message);
  }

  const urlFromParams = (overrides: Partial<Record<string, string>>) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    if (condition) sp.set('condition', condition);
    if (min) sp.set('min', min);
    if (max) sp.set('max', max);
    Object.entries(overrides).forEach(([k, v]) => {
      if (!v) return;
      sp.set(k, v);
    });
    const qs = sp.toString();
    return qs ? `/marketplace?${qs}` : '/marketplace';
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader title="Marketplace" description="Buy and sell with neighbors." />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
          <div className="w-full md:max-w-2xl">
            <MarketplaceSearch
              initialQ={q}
              category={category}
              condition={condition}
              min={min}
              max={max}
            />
          </div>
          <div className="flex items-center gap-2">
            <SignedIn>
              <AddMarketplaceItemButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  List an item
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(items ?? []).map((item) => (
            <Link
              key={item.id}
              href={`/marketplace/${item.id}`}
              className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <MarketplaceItemCard
                id={item.id}
                title={item.title}
                price={item.price}
                condition={item.condition}
                location={item.location}
                createdAt={item.created_at}
                imageUrl={(item.images?.[0] as string | undefined) ?? undefined}
              />
            </Link>
          ))}
        </div>

        {!items?.length ? (
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 p-8 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {q || category || condition || min || max
              ? 'No items match your filters.'
              : 'No items listed yet.'}
          </div>
        ) : null}
      </div>
    </div>
  );
}
