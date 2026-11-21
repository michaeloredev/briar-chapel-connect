import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { serviceSections } from '@/lib/data/services';
import { PageHeader } from '@/components/common/PageHeader';
import { providerCounts, sectionCount } from '@/lib/api/service-counts';

export const metadata: Metadata = {
  title: 'Services • Briar Chapel Connect',
  description: 'Browse local services in Briar Chapel',
};

/**
 * The services directory: one card per section, listing its service types
 * with their provider counts. The whole catalog fits on about a screen, and
 * every row goes straight to that service's providers.
 */
export default async function ServicesPage() {
  const counts = await providerCounts();

  return (
    <>
      <PageHeader title="Local Services" description="Discover trusted providers in your neighborhood." />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {serviceSections.map((section) => {
          const total = sectionCount(counts, section.slug);
          return (
            <section
              key={section.slug}
              aria-labelledby={`section-${section.slug}`}
              className="flex flex-col rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id={`section-${section.slug}`} className="text-lg font-semibold text-slate-900 dark:text-white">
                  <Link href={`/services/${section.slug}`} className="hover:text-blue-700 dark:hover:text-blue-300">
                    {section.title}
                  </Link>
                </h2>
                <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                  {total} {total === 1 ? 'provider' : 'providers'}
                </span>
              </div>

              <ul className="-mx-2 flex flex-col">
                {section.items.map((item) => {
                  const n = counts.get(`${section.slug}/${item.slug}`) ?? 0;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/services/${section.slug}/${item.slug}`}
                        className="group flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-slate-700/50"
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.colorClasses.bg}`}>
                          <item.icon className={`h-4 w-4 ${item.colorClasses.icon}`} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                          {item.title}
                        </span>
                        <span
                          className={`shrink-0 text-xs tabular-nums ${
                            n > 0 ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {n === 0 ? 'None yet' : n}
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-500"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <Link
                href={`/services/${section.slug}`}
                className="mt-auto inline-flex min-h-11 items-center gap-1 pt-3 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                See the whole section
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </section>
          );
        })}
      </div>
    </>
  );
}
