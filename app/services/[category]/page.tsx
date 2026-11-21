import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serviceSections } from '@/lib/data/services';
import { PageHeader } from '@/components/common/PageHeader';
import ServiceTypeCard from '@/components/services/ServiceTypeCard';
import { providerCounts } from '@/lib/api/service-counts';

export const metadata: Metadata = {
  title: 'Services Category • Briar Chapel Connect',
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function ServicesCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const section = serviceSections.find((s) => s.slug === category);
  if (!section) return notFound();
  const counts = await providerCounts();

  return (
    <>
      <PageHeader title={section.title} description="Choose a service to see neighbors' recommended providers." />
      <div className="grid gap-4 md:grid-cols-2">
        {section.items.map((item) => (
          <ServiceTypeCard
            key={item.slug}
            sectionSlug={section.slug}
            item={item}
            providerCount={counts.get(`${section.slug}/${item.slug}`) ?? 0}
          />
        ))}
      </div>
    </>
  );
}
