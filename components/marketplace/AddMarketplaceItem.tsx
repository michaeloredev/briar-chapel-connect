'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProviderLogoCropDialog } from '@/components/services/ProviderLogoCropDialog';
import { MARKETPLACE_PHOTO_SIZE } from '@/lib/images/cropImageToSquareWebp';
import { MARKETPLACE_CATEGORIES } from '@/lib/data/marketplace-categories';

const MAX_PHOTOS = 3;

export function AddMarketplaceItemButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState<string>('general');
  const [price, setPrice] = React.useState<string>('');
  const [condition, setCondition] = React.useState<'new' | 'like_new' | 'good' | 'fair' | 'poor'>('good');
  const [locationText, setLocationText] = React.useState('');
  const [contact, setContact] = React.useState('');
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

  function closeModal() {
    revokeCropUrl();
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!contact.trim()) {
        setError('Contact is required (email or phone).');
        setLoading(false);
        return;
      }
      const images: string[] = [];
      if (photos.length > 0) {
        setUploading(true);
        try {
          for (const file of photos.slice(0, MAX_PHOTOS)) {
            const fd = new FormData();
            fd.append('file', file);
            const up = await fetch('/api/uploads/marketplace-image', { method: 'POST', body: fd });
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
      const res = await fetch('/api/marketplace-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category: category || 'general',
          price: Number(price || 0),
          condition,
          location: locationText || 'Road',
          images,
          contact: contact.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create item');
      }
      setTitle('');
      setDescription('');
      setCategory('general');
      setPrice('');
      setCondition('good');
      setLocationText('');
      setContact('');
      setPhotos([]);
      closeModal();
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="List an item"
      >
        <Plus className="h-4 w-4" aria-hidden />
        List an item
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && closeModal()}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">List an Item</h2>
              <button
                type="button"
                className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => !loading && closeModal()}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What are you selling?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe condition, dimensions, pickup details…"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MARKETPLACE_CATEGORIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Price (USD)</label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like new</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Road"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Contact (email or phone) <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                  </label>
                  <input
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. name@example.com or (555) 123-4567"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This will be visible to buyers.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Photos <span className="font-normal text-slate-500 dark:text-slate-400">({photos.length}/{MAX_PHOTOS})</span>
                </label>
                {photoPreviews.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {photoPreviews.map((src, i) => (
                      <div key={src} className="relative">
                        <img
                          src={src}
                          alt={`Photo ${i + 1}`}
                          className="w-20 h-20 rounded-md object-cover border border-slate-200 dark:border-slate-700"
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
                  disabled={photos.length >= MAX_PHOTOS || !!imageToCrop}
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
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {photos.length >= MAX_PHOTOS
                    ? `Maximum of ${MAX_PHOTOS} photos added. Remove one to replace it.`
                    : `Add up to ${MAX_PHOTOS} photos, one at a time. Choose a photo, then crop to a square. We save ${MARKETPLACE_PHOTO_SIZE}×${MARKETPLACE_PHOTO_SIZE} WebP (or PNG).`}
                </p>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={closeModal}
                  disabled={loading || uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  disabled={loading || uploading || !contact.trim()}
                >
                  {loading || uploading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {imageToCrop ? (
        <ProviderLogoCropDialog
          imageSrc={imageToCrop}
          title="Crop photo"
          outputSize={MARKETPLACE_PHOTO_SIZE}
          fileBaseName="marketplace-photo"
          onCancel={revokeCropUrl}
          onComplete={handleCropComplete}
        />
      ) : null}
    </>
  );
}


