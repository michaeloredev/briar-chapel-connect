import type { Metadata } from 'next';
import { GridCard } from '@/components/ui/GridCard';
import Link from 'next/link';
import { serviceSections } from '@/lib/data/services';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata: Metadata = {
  title: 'Services • Briar Chapel Connect',
  description: 'Browse local services in Briar Chapel',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader title="Local Services" description="Discover trusted providers in your neighborhood." />

        {serviceSections.map((section) => (
          <section key={section.slug} className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              {section.title}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.slug}
                  href={`/services/${section.slug}/${item.slug}`}
                  className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <GridCard
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    colorClasses={item.colorClasses}
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
