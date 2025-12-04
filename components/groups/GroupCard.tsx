import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export type GroupCardProps = {
  id: string;
  title: string;
  description?: string;
  location?: string | null;
  typeLabel?: string;
  imageUrl?: string | null;
  className?: string;
  href?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
};

export default function GroupCard({
  id,
  title,
  description,
  location,
  typeLabel,
  imageUrl,
  className = '',
  href,
  icon: Icon,
  iconColorClass,
  iconBgClass,
}: GroupCardProps) {
  return (
    <Link
      href={href ?? `/groups/${id}`}
      className={`block rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label={`View group ${title}`}
    >
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${title} logo`}
            className="w-14 h-14 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            width={56}
            height={56}
          />
        ) : Icon ? (
          <div
            className={[
              'w-14 h-14 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700',
              iconBgClass ?? 'bg-slate-100 dark:bg-slate-800',
            ].join(' ')}
          >
            <Icon className={['w-7 h-7', iconColorClass ?? 'text-slate-600 dark:text-slate-300'].join(' ')} aria-hidden />
          </div>
        ) : null}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            {typeLabel ? (
              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-slate-700 dark:text-slate-200">
                {typeLabel}
              </span>
            ) : null}
            {location ? (
              <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-slate-700 dark:text-slate-200">
                {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}


