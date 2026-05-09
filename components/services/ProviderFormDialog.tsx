'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ProviderLogoCropDialog } from '@/components/services/ProviderLogoCropDialog';

export type ProviderFormInitial = {
  name: string;
  summary: string;
  details: string;
  tags: string;
  contactEmail: string;
  contactPhone: string;
  locationText: string;
  website: string;
  imageUrl: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  categorySlug: string;
  serviceSlug: string;
  editingId?: string | null;
  initial?: ProviderFormInitial | null;
};

export function ProviderFormDialog({
  open,
  onOpenChange,
  mode,
  categorySlug,
  serviceSlug,
  editingId,
  initial,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [locationText, setLocationText] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = React.useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = React.useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  React.useEffect(() => {
    if (!open) return;
    if (mode === 'create') {
      setName('');
      setSummary('');
      setDetails('');
      setTags('');
      setContactEmail('');
      setContactPhone('');
      setLocationText('');
      setWebsite('');
      setLogoFile(null);
      setRemoteImageUrl(null);
      setImageRemoved(false);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (mode === 'edit' && initial) {
      setName(initial.name);
      setSummary(initial.summary);
      setDetails(initial.details);
      setTags(initial.tags);
      setContactEmail(initial.contactEmail);
      setContactPhone(initial.contactPhone);
      setLocationText(initial.locationText);
      setWebsite(initial.website);
      setLogoFile(null);
      setRemoteImageUrl(initial.imageUrl);
      setImageRemoved(false);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, mode, initial]);

  function revokeCropUrl() {
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleCropComplete(file: File) {
    revokeCropUrl();
    setLogoFile(file);
    setImageRemoved(false);
    setRemoteImageUrl(null);
  }

  function closeDialog() {
    revokeCropUrl();
    onOpenChange(false);
  }

  async function readFailedResponse(res: Response): Promise<string> {
    const text = await res.text();
    try {
      const j = JSON.parse(text) as { error?: string; debug?: string };
      return (j.debug || j.error || text).trim() || `Request failed (${res.status})`;
    } catch {
      return text.trim() || `Request failed (${res.status})`;
    }
  }

  function clearLocalAfterSuccess() {
    revokeCropUrl();
    setLogoFile(null);
    setRemoteImageUrl(null);
    setImageRemoved(false);
    setError(null);
    onOpenChange(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let newUploadedUrl: string | null = null;
      if (logoFile) {
        setLogoUploading(true);
        try {
          const fd = new FormData();
          fd.append('file', logoFile);
          const up = await fetch('/api/uploads/provider-logo', { method: 'POST', body: fd });
          if (!up.ok) {
            throw new Error(await readFailedResponse(up));
          }
          const uploaded = await up.json();
          newUploadedUrl = uploaded?.url ?? null;
        } finally {
          setLogoUploading(false);
        }
      }

      if (mode === 'create') {
        const res = await fetch('/api/providers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: categorySlug,
            service: serviceSlug,
            name,
            summary,
            details,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            image_url: newUploadedUrl,
            location: locationText || null,
            website: website || null,
          }),
        });
        if (!res.ok) {
          throw new Error(await readFailedResponse(res));
        }
      } else {
        const id = editingId?.trim();
        if (!id) throw new Error('Missing provider id');
        let image_url: string | null | undefined;
        if (newUploadedUrl) {
          image_url = newUploadedUrl;
        } else if (imageRemoved) {
          image_url = null;
        } else {
          image_url = initial?.imageUrl ?? null;
        }
        const res = await fetch('/api/providers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            name,
            summary,
            details,
            contact_email: contactEmail || null,
            contact_phone: contactPhone || null,
            location: locationText || null,
            website: website || null,
            image_url,
          }),
        });
        if (!res.ok) {
          throw new Error(await readFailedResponse(res));
        }
      }

      clearLocalAfterSuccess();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const displayThumb = logoPreviewUrl || (mode === 'edit' && !imageRemoved ? remoteImageUrl : null);
  const title = mode === 'create' ? 'Add provider' : 'Edit provider';

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && !logoUploading && !imageToCrop && closeDialog()}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
              <button
                type="button"
                className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => !loading && !logoUploading && !imageToCrop && closeDialog()}
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Business or person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Summary</label>
                <input
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short one-line summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Details</label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longer description of services"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Neighborhood or city (e.g., Briar Chapel)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. insured, local, eco-friendly"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo (optional)</label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
                    {displayThumb ? (
                      <div className="flex shrink-0 flex-col items-center gap-1">
                        <img
                          src={displayThumb}
                          alt="Logo preview"
                          className="h-20 w-20 rounded-lg border border-slate-200 object-cover dark:border-slate-600"
                        />
                        <button
                          type="button"
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => {
                            setLogoFile(null);
                            setRemoteImageUrl(null);
                            setImageRemoved(true);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        disabled={!!imageToCrop}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) {
                            setLogoFile(null);
                            return;
                          }
                          if (!f.type.startsWith('image/')) {
                            setError('Please choose an image file.');
                            e.target.value = '';
                            return;
                          }
                          setError(null);
                          setImageRemoved(false);
                          const url = URL.createObjectURL(f);
                          setImageToCrop(url);
                        }}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-50 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
                      />
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Choose a photo, then crop to a square. We save 512×512 WebP (or PNG) for sharp thumbnails.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => !imageToCrop && closeDialog()}
                  disabled={loading || logoUploading || !!imageToCrop}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  disabled={loading || logoUploading}
                >
                  {loading || logoUploading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {imageToCrop ? (
        <ProviderLogoCropDialog
          imageSrc={imageToCrop}
          onCancel={revokeCropUrl}
          onComplete={handleCropComplete}
        />
      ) : null}
    </>
  );
}

