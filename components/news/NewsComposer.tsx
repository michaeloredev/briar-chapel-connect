'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { ProviderLogoCropDialog } from '@/components/services/ProviderLogoCropDialog';
import { MARKETPLACE_PHOTO_SIZE } from '@/lib/images/cropImageToSquareWebp';
import {
  MAX_NEWS_POST_IMAGES,
  MAX_NEWS_POST_LENGTH,
  NEWS_CATEGORIES,
  type NewsCategory,
} from '@/lib/data/news-categories';
import { errorMessage, responseError } from '@/lib/utils/errors';

/** Posting form at the top of the feed. */
export default function NewsComposer() {
  const router = useRouter();
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState<NewsCategory>('chatter');
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [photos]);

  function revokeCropUrl() {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleCropComplete(file: File) {
    revokeCropUrl();
    setPhotos((prev) => (prev.length >= MAX_NEWS_POST_IMAGES ? prev : [...prev, file]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const images: string[] = [];
      for (const file of photos.slice(0, MAX_NEWS_POST_IMAGES)) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await fetch('/api/uploads/news-image', { method: 'POST', body: fd });
        if (!up.ok) throw new Error(await responseError(up, 'Failed to upload image'));
        const uploaded = await up.json();
        if (uploaded?.url) images.push(uploaded.url);
      }
      const res = await fetch('/api/news-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), category, images }),
      });
      if (!res.ok) throw new Error(await responseError(res, 'Failed to post'));
      setContent('');
      setCategory('chatter');
      setPhotos([]);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Failed to post'));
    } finally {
      setSubmitting(false);
    }
  }

  const field =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <label htmlFor="news-content" className="sr-only">
          Your post
        </label>
        <textarea
          id="news-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={MAX_NEWS_POST_LENGTH}
          rows={3}
          placeholder="What's happening in the neighborhood?"
          disabled={submitting}
          className={`w-full ${field}`}
        />

        {photoPreviews.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {photoPreviews.map((src, i) => (
              <div key={src} className="relative">
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="h-20 w-20 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                  width={80}
                  height={80}
                />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor="news-category" className="sr-only">
            Category
          </label>
          <select
            id="news-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as NewsCategory)}
            disabled={submitting}
            className={`min-h-11 text-sm ${field}`}
          >
            {NEWS_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <label
            className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 ${
              photos.length >= MAX_NEWS_POST_IMAGES || submitting ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            Photo ({photos.length}/{MAX_NEWS_POST_IMAGES})
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={photos.length >= MAX_NEWS_POST_IMAGES || submitting || !!imageToCrop}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                  setError('Please choose an image file.');
                  e.target.value = '';
                  return;
                }
                setError(null);
                setImageToCrop(URL.createObjectURL(file));
              }}
            />
          </label>

          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="ml-auto inline-flex min-h-11 items-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-800"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      {imageToCrop ? (
        <ProviderLogoCropDialog
          imageSrc={imageToCrop}
          title="Crop photo"
          outputSize={MARKETPLACE_PHOTO_SIZE}
          fileBaseName="news-photo"
          onCancel={revokeCropUrl}
          onComplete={handleCropComplete}
        />
      ) : null}
    </>
  );
}
