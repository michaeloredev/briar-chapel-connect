'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProviderCard from '@/components/services/ProviderCard';
import { ProviderFormDialog, type ProviderFormInitial } from '@/components/services/ProviderFormDialog';

export type Provider = {
  id: string;
  name: string;
  rating: number;
  reviewCount?: number;
  tags?: string[];
  summary?: string;
  details?: string;
  imageUrl?: string;
  website?: string;
  phone?: string;
  contactEmail?: string;
  location?: string;
};

type ProviderListProps = {
  providers: Provider[];
  /** Required for superadmin add/edit on a single service page */
  categorySlug?: string;
  serviceSlug?: string;
  canManageProviders?: boolean;
};

export function ProviderList({
  providers,
  categorySlug = '',
  serviceSlug = '',
  canManageProviders = false,
}: ProviderListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editInitial, setEditInitial] = React.useState<ProviderFormInitial | null>(null);

  const sortedProviders = React.useMemo(() => {
    return [...providers].sort((a, b) => {
      const ra = Number.isFinite(a.rating) ? a.rating : 0;
      const rb = Number.isFinite(b.rating) ? b.rating : 0;
      if (rb !== ra) return rb - ra;
      return a.name.localeCompare(b.name);
    });
  }, [providers]);

  function openCreate() {
    setFormMode('create');
    setEditingId(null);
    setEditInitial(null);
    setFormOpen(true);
  }

  function openEdit(p: Provider) {
    const initial: ProviderFormInitial = {
      name: p.name,
      summary: p.summary ?? '',
      details: p.details ?? '',
      tags: (p.tags ?? []).join(', '),
      contactEmail: p.contactEmail ?? '',
      contactPhone: p.phone ?? '',
      locationText: p.location ?? '',
      website: p.website ?? '',
      imageUrl: p.imageUrl ?? null,
    };
    setFormMode('edit');
    setEditingId(p.id);
    setEditInitial(initial);
    setFormOpen(true);
  }

  if (!providers?.length) {
    return (
      <div>
        {canManageProviders ? (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add provider
            </button>
          </div>
        ) : null}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-8 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          No providers found yet.
        </div>
        <ProviderFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          categorySlug={categorySlug}
          serviceSlug={serviceSlug}
          editingId={editingId}
          initial={editInitial}
        />
      </div>
    );
  }

  return (
    <div>
      {canManageProviders ? (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add provider
          </button>
        </div>
      ) : null}
      <div className="grid gap-4">
        {sortedProviders.map((p) => (
          <ProviderCard
            key={p.id}
            id={p.id}
            name={p.name}
            summary={p.summary}
            details={p.details}
            rating={p.rating}
            reviewCount={p.reviewCount}
            tags={p.tags}
            imageUrl={p.imageUrl}
            website={p.website}
            phone={p.phone}
            deletable={canManageProviders}
            canManage={canManageProviders}
            onEdit={canManageProviders ? () => openEdit(p) : undefined}
            onDeleted={() => router.refresh()}
          />
        ))}
      </div>
      <ProviderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        categorySlug={categorySlug}
        serviceSlug={serviceSlug}
        editingId={editingId}
        initial={editInitial}
      />
    </div>
  );
}

export default ProviderList;
