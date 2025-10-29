import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serviceSections } from '@/lib/data/services';
import { PageHeader } from '@/components/common/PageHeader';
import ProviderList from '@/components/services/ProviderList';

import { AddProviderButton } from '@/components/ui/AddProvider';

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

  // Placeholder for future DB fetch based on category/service
  const providers = [
    { id: '1', name: 'Example Provider LLC', rating: 4.6, tags: ['Local', 'Insured', 'Family-owned'] },
    { id: '2', name: 'Neighborhood Pros', rating: 4.2, tags: ['Verified', 'Eco-friendly'] },
  ];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader title={item.title} description={item.description} />
        <ProviderList providers={providers} />
        <AddProviderButton categorySlug={category} serviceSlug={service} className="mt-6" />
      </div>
    </div>
  );
}
