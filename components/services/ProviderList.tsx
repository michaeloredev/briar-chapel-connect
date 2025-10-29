import React from 'react';
import StarRating from '@/components/ui/StarRating';
import TagPill from '@/components/ui/TagPill';

export type Provider = {
  id: string;
  name: string;
  rating: number;
  tags?: string[];
};

type ProviderListProps = {
  providers: Provider[];
};

export function ProviderList({ providers }: ProviderListProps) {
  if (!providers?.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-8 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        No providers found yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {providers.map((p) => (
        <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{p.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                <StarRating value={p.rating} size="sm" showValue />
                <span className="text-xs text-slate-500">({p.rating.toFixed(1)})</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.tags?.map((t) => (
                <TagPill key={t} label={t} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProviderList;
