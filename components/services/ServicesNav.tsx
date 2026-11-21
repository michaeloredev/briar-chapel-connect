'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import { serviceSections } from '@/lib/data/services';

type Props = {
  /** Active providers per `"<section>/<service>"`, from providerCounts(). */
  counts: Record<string, number>;
};

/**
 * The services side menu: every section as an accordion of its service
 * types, with provider counts. The section you're in starts open and the
 * page you're on is highlighted. On a phone the whole menu folds into one
 * "Browse categories" panel above the content, so providers come first.
 *
 * Built on native <details>, so the accordion works with the keyboard and
 * without any open/closed state here.
 */
export default function ServicesNav({ counts }: Props) {
  const pathname = usePathname() ?? '';
  const [, , activeSection = '', activeService = ''] = pathname.split('/');

  const sectionTotal = (slug: string) =>
    Object.entries(counts).reduce((sum, [category, n]) => (category.startsWith(`${slug}/`) ? sum + n : sum), 0);

  const countBadge = (n: number, active: boolean) => (
    <span
      className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums ${
        active
          ? 'bg-blue-600 text-white'
          : n > 0
            ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
            : 'text-slate-400 dark:text-slate-500'
      }`}
    >
      {n}
    </span>
  );

  const menu = (
    <ul className="flex flex-col gap-1">
      <li>
        <Link
          href="/services"
          aria-current={pathname === '/services' ? 'page' : undefined}
          className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
            pathname === '/services'
              ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-300'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60'
          }`}
        >
          <LayoutGrid className="h-4 w-4" aria-hidden />
          All services
        </Link>
      </li>
      {serviceSections.map((section) => {
        const inSection = section.slug === activeSection;
        return (
          <li key={section.slug}>
            <details open={inSection} className="group">
              <summary
                className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden ${
                  inSection
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60'
                }`}
              >
                <ChevronDown
                  className="h-4 w-4 shrink-0 -rotate-90 text-slate-400 transition-transform group-open:rotate-0"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">{section.title}</span>
                <span className="shrink-0 text-xs font-normal tabular-nums text-slate-500 dark:text-slate-400">
                  {sectionTotal(section.slug)}
                </span>
              </summary>
              <ul className="mb-2 ml-4 mt-1 flex flex-col gap-0.5 border-l border-slate-200 pl-2 dark:border-slate-700">
                <li>
                  <Link
                    href={`/services/${section.slug}`}
                    aria-current={inSection && !activeService ? 'page' : undefined}
                    className={`flex min-h-10 items-center rounded-md px-2 text-sm ${
                      inSection && !activeService
                        ? 'bg-blue-50 font-medium text-blue-700 dark:bg-slate-700 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'
                    }`}
                  >
                    Everything in this section
                  </Link>
                </li>
                {section.items.map((item) => {
                  const active = inSection && item.slug === activeService;
                  const n = counts[`${section.slug}/${item.slug}`] ?? 0;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/services/${section.slug}/${item.slug}`}
                        aria-current={active ? 'page' : undefined}
                        className={`flex min-h-10 items-center gap-2 rounded-md px-2 text-sm ${
                          active
                            ? 'bg-blue-50 font-medium text-blue-700 dark:bg-slate-700 dark:text-blue-300'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${item.colorClasses.icon}`} aria-hidden />
                        <span className="min-w-0 flex-1">{item.title}</span>
                        {countBadge(n, active)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Phone and tablet: one collapsed panel above the content. */}
      <details className="group/menu rounded-xl border border-slate-200 bg-white shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-800">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
          Browse categories
          <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open/menu:rotate-180" aria-hidden />
        </summary>
        <nav aria-label="Service categories" className="border-t border-slate-200 p-2 dark:border-slate-700">
          {menu}
        </nav>
      </details>

      {/* Desktop: a side menu that stays in view. */}
      <nav
        aria-label="Service categories"
        className="hidden max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:sticky lg:top-6 lg:block dark:border-slate-700 dark:bg-slate-800"
      >
        {menu}
      </nav>
    </>
  );
}
