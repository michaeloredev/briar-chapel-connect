'use client';
import React from 'react';
import StarRating from '@/components/ui/StarRating';
import TagPill from '@/components/ui/TagPill';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

export type ProviderCardProps = {
  id: string;
  name: string;
  summary?: string;
  details?: string;
  rating: number;
  tags?: string[];
  className?: string;
  deletable?: boolean;
  onDeleted?: () => void;
  imageUrl?: string;
};

export function ProviderCard({
  id,
  name,
  summary,
  details,
  rating,
  tags,
  className = '',
  deletable = true,
  onDeleted,
  imageUrl,
}: ProviderCardProps) {
  const [deleting, setDeleting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [loadingRecord, setLoadingRecord] = React.useState(false);
  const [recordError, setRecordError] = React.useState<string | null>(null);
  const [record, setRecord] = React.useState<Database['public']['Tables']['services']['Row'] | null>(null);

  async function handleDelete() {
    if (deleting) return;
    const ok = window.confirm('Delete this provider? This action cannot be undone.');
    if (!ok) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/providers?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to delete provider');
      }
      if (onDeleted) {
        onDeleted();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function openDetails() {
    setOpen(true);
    if (record) return;
    try {
      setLoadingRecord(true);
      setRecordError(null);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single();
      if (error) {
        throw new Error(error.message || 'Failed to load details');
      }
      setRecord(data);
    } catch (e: any) {
      setRecordError(e?.message ?? 'Failed to load details');
    } finally {
      setLoadingRecord(false);
    }
  }

  return (
    <>
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer ${className}`}
      role="button"
      onClick={openDetails}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${name} logo`}
              className="w-14 h-14 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              width={56}
              height={56}
            />
          ) : null}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{name}</h3>
            {summary || details ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{summary ?? details}</p>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <StarRating value={rating} size="sm" showValue />
              <span className="text-xs text-slate-500">({rating.toFixed(1)})</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {tags?.map((t) => (
            <TagPill key={t} label={t} />
          ))}
          {deletable ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={deleting}
              className="ml-2 p-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="w-5 h-5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
    {open ? (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="relative z-10 w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
              {record?.image_url || imageUrl ? (
              <img
                  src={record?.image_url ?? imageUrl!}
                alt={`${name} logo`}
                className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                width={64}
                height={64}
              />
            ) : null}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{record?.title ?? name}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            <div className="mt-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                    {(record?.details ?? record?.summary ?? details ?? summary) || 'No description provided.'}
              </p>
            </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Email: </span>
                    {record?.contact_email || '—'}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Phone: </span>
                    {record?.contact_phone || '—'}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Location: </span>
                    {record?.location || 'Briar Chapel'}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium">Status: </span>
                    {record?.status || 'active'}
                </div>
                <div className="text-slate-600 dark:text-slate-300 col-span-1 sm:col-span-2">
                  <span className="font-medium">Website: </span>
                    {record?.website ? (
                    <a
                        href={record.website.startsWith('http') ? record.website : `https://${record.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                        {record.website}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
                {loadingRecord ? (
                <p className="mt-4 text-xs text-slate-500">Loading details…</p>
              ) : null}
                {recordError ? (
                  <p className="mt-4 text-xs text-red-600 dark:text-red-400">{recordError}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}

export default ProviderCard;


