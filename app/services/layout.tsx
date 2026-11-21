import ServicesNav from '@/components/services/ServicesNav';
import { providerCounts } from '@/lib/api/service-counts';

/**
 * Every services page -- the overview, a section, a service's providers and
 * search -- shares this frame: the category side menu on the left (a
 * collapsed panel on top, on a phone) and the page on the right.
 */
export default async function ServicesLayout({ children }: { children: React.ReactNode }) {
  const counts = Object.fromEntries(await providerCounts());

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:px-8 lg:py-12">
        <aside className="lg:w-72 lg:shrink-0 lg:self-stretch">
          <ServicesNav counts={counts} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
