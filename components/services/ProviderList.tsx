import React from 'react';
import StarRating from '@/components/ui/StarRating';
import TagPill from '@/components/ui/TagPill';
import ProviderCard from '@/components/services/ProviderCard';

export type Provider = {
  id: string;
  name: string;
  rating: number;
  tags?: string[];
  summary?: string;
  details?: string;
  imageUrl?: string;
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
        <ProviderCard
          key={p.id}
          id={p.id}
          name={p.name}
          summary={p.summary}
          details={p.details}
          rating={p.rating}
          tags={p.tags}
          imageUrl={p.imageUrl}
        />
      ))}
    </div>
  );
}

export default ProviderList;
