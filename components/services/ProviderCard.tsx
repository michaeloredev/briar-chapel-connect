'use client';
import React from 'react';
import StarRating from '@/components/ui/StarRating';
import TagPill from '@/components/ui/TagPill';
import { Trash2, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';
import StarRatingInput from '@/components/ui/StarRatingInput';
import { useRouter } from 'next/navigation';

export type ProviderCardProps = {
  id: string;
  name: string;
  summary?: string;
  details?: string;
  rating: number;
  reviewCount?: number;
  tags?: string[];
  className?: string;
  deletable?: boolean;
  onDeleted?: () => void;
  imageUrl?: string;
  website?: string;
  phone?: string;
};

export function ProviderCard({
  id,
  name,
  summary,
  details,
  rating,
  reviewCount,
  tags,
  className = '',
  deletable = true,
  onDeleted,
  imageUrl,
  website,
  phone,
}: ProviderCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [loadingRecord, setLoadingRecord] = React.useState(false);
  const [recordError, setRecordError] = React.useState<string | null>(null);
  type ServiceDetails = Pick<
    Database['public']['Tables']['services']['Row'],
    'id' | 'title' | 'summary' | 'details' | 'website' | 'location' | 'status' | 'image_url' | 'contact_email' | 'contact_phone'
  >;
  const [record, setRecord] = React.useState<ServiceDetails | null>(null);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [reviewRating, setReviewRating] = React.useState<number>(0);
  const [reviewText, setReviewText] = React.useState<string>('');
  const [submittingReview, setSubmittingReview] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);
  const [displayRating, setDisplayRating] = React.useState<number>(rating);
  const [displayReviewCount, setDisplayReviewCount] = React.useState<number>(reviewCount ?? 0);
  type ReviewRow = Pick<
    Database['public']['Tables']['service_reviews']['Row'],
    'id' | 'created_at' | 'rating' | 'comment' | 'user_id' | 'author_name'
  >;
  const [reviews, setReviews] = React.useState<ReviewRow[] | null>(null);
  const [loadingReviews, setLoadingReviews] = React.useState(false);
  const [reviewsError, setReviewsError] = React.useState<string | null>(null);
  const [reviewsExpanded, setReviewsExpanded] = React.useState(false);

  React.useEffect(() => {
    setDisplayRating(rating);
    setDisplayReviewCount(reviewCount ?? 0);
  }, [rating, reviewCount]);

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
        .select('id, title, summary, details, website, location, status, image_url, contact_email, contact_phone')
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

  async function loadReviews() {
    if (loadingReviews || reviews !== null) return;
    try {
      setLoadingReviews(true);
      setReviewsError(null);
      const { data, error } = await supabase
        .from('service_reviews')
        .select('id, created_at, rating, comment, user_id, author_name')
        .eq('service_id', id)
        .order('created_at', { ascending: false });
      if (error) {
        throw new Error(error.message || 'Failed to load reviews');
      }
      setReviews(data as ReviewRow[]);
    } catch (e: any) {
      setReviewsError(e?.message ?? 'Failed to load reviews');
    } finally {
      setLoadingReviews(false);
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
              <StarRating value={displayRating} size="sm" showValue />
              <span className="text-xs text-slate-500">({displayReviewCount})</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {tags?.map((t) => (
            <TagPill key={t} label={t} />
          ))}
          {website || phone ? (
            <div
              className="ml-2 flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300"
              onClick={(e) => e.stopPropagation()}
            >
              {website ? (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                  title="Website"
                >
                  {website}
                </a>
              ) : null}
              {phone ? (
                <span title="Phone">
                  {phone}
                </span>
              ) : null}
            </div>
          ) : null}
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
          className="relative z-10 w-full max-w-2xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6 max-h-[80vh] overflow-y-auto"
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
                  className="font-bold rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" aria-hidden />
                </button>
              </div>
            <div className="mt-2">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                    {(record?.details ?? record?.summary ?? details ?? summary) || 'No description provided.'}
              </p>
            </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="text-slate-600 dark:text-slate-300">
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
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  aria-expanded={reviewsExpanded}
                  onClick={async () => {
                    const next = !reviewsExpanded;
                    setReviewsExpanded(next);
                    if (next && reviews === null && !loadingReviews) {
                      await loadReviews();
                    }
                  }}
                  className="w-full flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Reviews</span>
                  <ChevronDown
                    className={['w-4 h-4 transition-transform', reviewsExpanded ? 'rotate-180' : 'rotate-0'].join(' ')}
                    aria-hidden
                  />
                </button>
                {reviewsExpanded ? (
                  <>
                    {loadingReviews ? (
                      <p className="mt-2 text-xs text-slate-500">Loading reviews…</p>
                    ) : reviewsError ? (
                      <p className="mt-2 text-xs text-red-600 dark:text-red-400">{reviewsError}</p>
                    ) : (
                      (() => {
                        const comments = (reviews ?? []).filter((r) => (r.comment || '').trim().length > 0);
                        return comments.length > 0 ? (
                          <ul className="mt-3 space-y-3">
                            {comments.map((r) => (
                              <li key={r.id} className="rounded-md border border-slate-200 dark:border-slate-700 p-3">
                                <div className="flex items-center justify-between">
                                  <StarRating value={r.rating} size="sm" />
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] text-slate-600 dark:text-slate-300">{r.author_name || 'Anonymous'}</span>
                                    <span className="text-[11px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                  {r.comment}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No comments yet.</p>
                        );
                      })()
                    )}
                  </>
                ) : null}
              </div>
              {!showReviewForm ? (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(true);
                    }}
                    className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Rate
                  </button>
                </div>
              ) : (
                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">Your Review</h3>
                  <div className="mt-3">
                    <StarRatingInput
                      value={reviewRating}
                      onChange={setReviewRating}
                      size="lg"
                      aria-label="Your rating"
                    />
                    <p className="mt-1 text-xs text-slate-500">Select a rating from 1 to 5 stars.</p>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Comment (optional)</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Share a few words about your experience…"
                    />
                  </div>
                  {reviewError ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{reviewError}</p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewError(null);
                      }}
                      className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
                          setReviewError('Please select a rating between 1 and 5.');
                          return;
                        }
                        setReviewError(null);
                        try {
                          setSubmittingReview(true);
                          const res = await fetch('/api/service-reviews', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              service_id: id,
                              rating: reviewRating,
                              comment: reviewText.trim() || undefined,
                            }),
                          });
                          if (!res.ok) {
                            const msg = await res.text();
                            throw new Error(msg || 'Failed to submit review');
                          }
                          const created = (await res.json()) as ReviewRow;
                          // Optimistically update average and count
                          const prevCount = displayReviewCount;
                          const newCount = prevCount + 1;
                          const newAvg = ((displayRating * prevCount) + reviewRating) / newCount;
                          setDisplayReviewCount(newCount);
                          setDisplayRating(newAvg);
                          // If a comment was provided, prepend it to the visible list
                          if ((created.comment || '').trim().length > 0) {
                            setReviews((prev) => {
                              const next = prev ? [created, ...prev] : [created];
                              return next;
                            });
                            setReviewsExpanded(true);
                          }
                          setShowReviewForm(false);
                          setReviewText('');
                          setReviewRating(0);
                          alert('Thanks for your review!');
                          // Sync server-rendered data
                          router.refresh();
                        } catch (e: any) {
                          setReviewError(e?.message ?? 'Failed to submit review');
                        } finally {
                          setSubmittingReview(false);
                        }
                      }}
                      disabled={submittingReview}
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              )}
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


