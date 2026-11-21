import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ServiceItem } from '@/lib/data/services';

export type ServiceTypeCardProps = {
  sectionSlug: string;
  item: ServiceItem;
  /** Active providers listed for this service type. */
  providerCount: number;
};

/** A compact, clickable card for one service type, used on the services overview and section pages. */
export default function ServiceTypeCard({ sectionSlug, item, providerCount }: ServiceTypeCardProps) {
  const Icon = item.icon;
  return (
    <Link
      href={`/services/${sectionSlug}/${item.slug}`}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-surface p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${item.colorClasses.bg}`}>
        <Icon className={`h-5 w-5 ${item.colorClasses.icon}`} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold text-slate-900 dark:text-white">{item.title}</span>
        <span className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {providerCount === 0
            ? 'No providers yet'
            : `${providerCount} ${providerCount === 1 ? 'provider' : 'providers'}`}
        </span>
      </span>
      <ChevronRight
        className="mt-3 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
