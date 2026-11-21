import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { serviceSections } from '@/lib/data/services';
import { PageHeader } from '@/components/common/PageHeader';
import ServiceTypeCard from '@/components/services/ServiceTypeCard';
import { providerCounts, sectionCount } from '@/lib/api/service-counts';

export const metadata: Metadata = {
  title: 'Services • Briar Chapel Connect',
  description: 'Browse local services in Briar Chapel',
};

export default async function ServicesPage() {
  const counts = await providerCounts();

  return (
    <>
      <PageHeader title="Local Services" description="Discover trusted providers in your neighborhood." />

      <div className="flex flex-col gap-10">
        {serviceSections.map((section) => {
          const total = sectionCount(counts, section.slug);
          return (
            <section key={section.slug} aria-labelledby={`section-${section.slug}`}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`section-${section.slug}`} className="text-xl font-semibold text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <Link
                  href={`/services/${section.slug}`}
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {total === 0 ? 'View section' : `View all ${total} ${total === 1 ? 'provider' : 'providers'}`}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
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
            </section>
          );
        })}
      </div>
    </>
  );
}
