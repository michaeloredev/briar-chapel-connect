import ServicesFrame from '@/components/services/ServicesFrame';
import { providerCounts } from '@/lib/api/service-counts';

/**
 * Every services page shares this background and container. Inside it,
 * ServicesFrame adds the category side menu beside each page except the
 * overview, which is the full directory itself.
 */
export default async function ServicesLayout({ children }: { children: React.ReactNode }) {
  const counts = Object.fromEntries(await providerCounts());

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <ServicesFrame counts={counts}>{children}</ServicesFrame>
      </div>
    </div>
  );
}
