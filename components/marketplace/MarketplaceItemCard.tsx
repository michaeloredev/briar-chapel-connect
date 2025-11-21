'use client';

import * as React from 'react';

type Props = {
  id: string;
  title: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location: string;
  createdAt: string;
  imageUrl?: string;
};

export default function MarketplaceItemCard({
  title,
  price,
  condition,
  location,
  createdAt,
  imageUrl,
}: Props) {
  const time = new Date(createdAt);
  const dateText = isNaN(time.getTime()) ? '' : time.toLocaleDateString();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:shadow-sm transition-shadow">
      <div className="aspect-square bg-slate-100 dark:bg-slate-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            width={512}
            height={512}
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{title}</h3>
          <div className="text-sm font-semibold text-slate-900 dark:text-white">${price.toFixed(0)}</div>
        </div>
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span className="capitalize">{condition.replace('_', ' ')}</span>
          <span aria-hidden>•</span>
          <span className="truncate">{location}</span>
        </div>
        {dateText ? (
          <div className="mt-1 text-[11px] text-slate-500">{dateText}</div>
        ) : null}
      </div>
    </div>
  );
}


