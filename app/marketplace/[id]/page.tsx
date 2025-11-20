import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import MarketplaceImageCarousel from '@/components/marketplace/MarketplaceImageCarousel';
import { auth } from '@clerk/nextjs/server';
import DeleteMarketplaceItemButton from '@/components/marketplace/DeleteMarketplaceItemButton';

export const metadata: Metadata = {
  title: 'Marketplace Item • Briar Chapel Connect',
};

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MarketplaceDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return notFound();

  const supabase = await createClient();
  type Row = Database['public']['Tables']['marketplace_items']['Row'];
  const { data: item, error } = await supabase
    .from('marketplace_items')
    .select('*')
    .eq('id', id)
    .single<Row>();
  if (error || !item) return notFound();

  const { userId: viewerId } = await auth();
  const isOwner = Boolean(viewerId && viewerId === item.user_id);

  const created = new Date(item.created_at);
  const dateText = isNaN(created.getTime()) ? '' : created.toLocaleString();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            {Array.isArray(item.images) && item.images.length > 1 ? (
              <MarketplaceImageCarousel images={item.images as any} alt={item.title} />
            ) : (
              <div className="aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden rounded-xl">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0] as any}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    width={1024}
                    height={1024}
                  />
                ) : null}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{item.title}</h1>
            <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
              ${Number(item.price || 0).toFixed(0)}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="capitalize">{item.condition.replace('_', ' ')}</span>
              <span className="px-2" aria-hidden>•</span>
              <span>{item.location}</span>
              {dateText ? (
                <>
                  <span className="px-2" aria-hidden>•</span>
                  <span>{dateText}</span>
                </>
              ) : null}
            </div>
            {item.contact ? (
              <div className="mt-3 text-sm">
                <span className="font-medium text-slate-900 dark:text-slate-200">Contact: </span>
                <span className="text-slate-700 dark:text-slate-300">{item.contact}</span>
              </div>
            ) : null}
            {item.description ? (
              <p className="mt-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.description}</p>
            ) : null}
            {isOwner ? <DeleteMarketplaceItemButton id={item.id} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
