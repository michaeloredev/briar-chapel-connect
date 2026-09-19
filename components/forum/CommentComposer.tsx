'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { ProviderLogoCropDialog } from '@/components/services/ProviderLogoCropDialog';
import { SQUARE_IMAGE_SIZE } from '@/lib/images/cropImageToSquareWebp';

const MAX_PHOTOS = 5;

type Props = {
  placeholder?: string;
  onSubmit: (content: string, images: string[]) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
};

export default function CommentComposer({ placeholder = 'Write a comment…', onSubmit, disabled, className = '' }: Props) {
  const [value, setValue] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [photos, setPhotos] = React.useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
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
    setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, file]));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      const images: string[] = [];
      if (photos.length > 0) {
        setUploading(true);
        try {
          for (const file of photos.slice(0, MAX_PHOTOS)) {
            const fd = new FormData();
            fd.append('file', file);
            const up = await fetch('/api/uploads/comment-image', { method: 'POST', body: fd });
            if (!up.ok) {
              const msg = await up.text();
              throw new Error(msg || 'Failed to upload image');
            }
            const uploaded = await up.json();
            if (uploaded?.url) images.push(uploaded.url);
          }
        } finally {
          setUploading(false);
        }
      }
      await onSubmit(value.trim(), images);
      setValue('');
      setPhotos([]);
      revokeCropUrl();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to post comment';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={className}>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled || submitting}
        />
        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="mt-2">
          {photoPreviews.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {photoPreviews.map((src, i) => (
                <div key={src} className="relative">
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="h-20 w-20 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                    width={80}
                    height={80}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={disabled || submitting || photos.length >= MAX_PHOTOS || !!imageToCrop}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (photos.length >= MAX_PHOTOS) {
                setError(`You can add up to ${MAX_PHOTOS} photos.`);
                e.target.value = '';
                return;
              }
              if (!file.type.startsWith('image/')) {
                setError('Please choose an image file.');
                e.target.value = '';
                return;
              }
              setError(null);
              setImageToCrop(URL.createObjectURL(file));
            }}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {photos.length >= MAX_PHOTOS
              ? `Maximum of ${MAX_PHOTOS} photos added. Remove one to replace it.`
              : `Add up to ${MAX_PHOTOS} photos, one at a time. Choose a photo, then crop to a square. We save ${SQUARE_IMAGE_SIZE}×${SQUARE_IMAGE_SIZE} WebP (or PNG) for sharp thumbnails.`}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-end">
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            disabled={disabled || submitting || uploading || !value.trim()}
          >
            {submitting || uploading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      {imageToCrop ? (
        <ProviderLogoCropDialog
          imageSrc={imageToCrop}
          title="Crop photo"
          outputSize={SQUARE_IMAGE_SIZE}
          fileBaseName="comment-photo"
          onCancel={revokeCropUrl}
          onComplete={handleCropComplete}
        />
      ) : null}
    </>
  );
}
