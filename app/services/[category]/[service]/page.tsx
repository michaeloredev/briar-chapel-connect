import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serviceSections } from '@/lib/data/services';
import { PageHeader } from '@/components/common/PageHeader';
import ProviderList from '@/components/services/ProviderList';

import { AddProviderButton } from '@/components/ui/AddProvider';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Service • Briar Chapel Connect',
};

interface PageProps {
  params: Promise<{ category: string; service: string }>;
}

export default async function ServiceDetailListPage({ params }: PageProps) {
  const { category, service } = await params;
  const section = serviceSections.find((s) => s.slug === category);
  const item = section?.items.find((i) => i.slug === service);
  if (!section || !item) return notFound();

  // Fetch providers from Supabase filtered by category/service
  const supabase = await createClient();
  type ServiceRow = Pick<
    Database['public']['Tables']['services']['Row'],
    'id' | 'title' | 'summary' | 'details' | 'website' | 'location' | 'category' | 'status' | 'image_url'
  >;
  const { data: rows, error } = await supabase
    .from('services')
    .select('id, title, summary, details, website, location, category, status, image_url')
    .eq('category', `${category}/${service}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .returns<ServiceRow[]>();

  if (error) {
    console.error('Failed to load providers:', error.message);
  }

  const providers =
    (rows ?? []).map((r) => ({
      id: r.id,
      name: r.title,
      summary: r.summary ?? undefined,
      details: r.details ?? undefined,
      imageUrl: r.image_url ?? undefined,
      rating: 2.5,
      // No tags column yet; leaving undefined to avoid UI clutter
    })) ?? [];


    console.log(providers);
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader title={item.title} description={item.description} />
        <ProviderList providers={providers} />
        <div className="mt-6">
          <SignedIn>
            <AddProviderButton categorySlug={category} serviceSlug={service} />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                Sign in to add a provider
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
