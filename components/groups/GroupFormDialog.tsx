'use client';

import * as React from 'react';
import { ImagePlus, Lock, Pencil, Plus, Search, Users, X } from 'lucide-react';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';
import { useRouter } from 'next/navigation';
import { GROUP_TYPES } from '@/lib/data/group-types';
import { iconLabel, isGroupIcon, searchGroupIcons } from '@/lib/data/group-icons';
import { ProviderLogoCropDialog } from '@/components/services/ProviderLogoCropDialog';

/** The subset of a group this form can edit. */
export type EditableGroup = {
  id: string;
  title: string;
  description: string;
  type: string;
  location?: string | null;
  image_url?: string | null;
  icon?: string | null;
  is_private?: boolean;
};

/** How many icons the picker shows at once; a search narrows the rest. */
const ICON_RESULTS = 48;

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

/** Routes answer with `{ error }` JSON; surface that rather than the raw body. */
async function readFailedResponse(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      return parsed?.error || fallback;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}

/**
 * Remove a picture that was uploaded moments ago but whose group write then
 * failed, so it doesn't sit in the bucket with nothing pointing at it.
 */
async function discardUploadedImage(url: string): Promise<void> {
  try {
    await fetch(`/api/uploads/group-image?url=${encodeURIComponent(url)}`, { method: 'DELETE' });
  } catch {
    // Best effort.
  }
}

type Props = {
  className?: string;
  /**
   * Present puts the dialog in edit mode: the form opens populated and submits
   * a PATCH for this row instead of creating a new group.
   */
  group?: EditableGroup;
};

export default function GroupFormDialog({ className = '', group }: Props) {
  const router = useRouter();
  const isEdit = Boolean(group);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(group?.title ?? '');
  const [description, setDescription] = React.useState(group?.description ?? '');
  const [type, setType] = React.useState(group?.type ?? GROUP_TYPES[0].value);
  const [location, setLocation] = React.useState(group?.location ?? '');
  const [icon, setIcon] = React.useState(group?.icon ?? '');
  const [isPrivate, setIsPrivate] = React.useState(group?.is_private ?? false);
  const [iconQuery, setIconQuery] = React.useState('');

  // Picture: a newly cropped file waiting to upload, or the saved one, or neither.
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [savedImage, setSavedImage] = React.useState<string | null>(group?.image_url ?? null);
  const [imageToCrop, setImageToCrop] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function closeCrop() {
    if (imageToCrop) URL.revokeObjectURL(imageToCrop);
    setImageToCrop(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePicture() {
    setImageFile(null);
    setSavedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const shownImage = imagePreview ?? savedImage;
  // Icons take the group type's colors; the type's own icon is the default.
  const typeMeta = GROUP_TYPES.find((t) => t.value === type);
  const tint = {
    bg: typeMeta?.colorClasses.bg ?? 'bg-slate-100 dark:bg-slate-800',
    color: typeMeta?.colorClasses.icon ?? 'text-slate-600 dark:text-slate-300',
  };
  const TypeIcon = typeMeta?.icon ?? Users;
  const chosenIcon: IconName | null = icon && isGroupIcon(icon) ? icon : null;
  const { results: iconResults, total: iconTotal } = searchGroupIcons(iconQuery, ICON_RESULTS);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setLoading(true);
    setError(null);
    let uploadedUrl: string | null = null;
    let saved = false;
    try {
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const up = await fetch('/api/uploads/group-image', { method: 'POST', body: fd });
        if (!up.ok) throw new Error(await readFailedResponse(up, 'Failed to upload picture'));
        uploadedUrl = ((await up.json()) as { url?: string }).url ?? null;
      }

      const res = await fetch('/api/groups', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEdit ? { id: group!.id } : {}),
          title: title.trim(),
          description: description.trim(),
          type,
          location: location.trim() || null,
          icon: icon || null,
          is_private: isPrivate,
          // Only send the picture when it changed: a new upload, or removal.
          ...(uploadedUrl ? { image_url: uploadedUrl } : savedImage !== (group?.image_url ?? null) ? { image_url: savedImage } : {}),
        }),
      });
      if (!res.ok) {
        throw new Error(await readFailedResponse(res, isEdit ? 'Failed to update group' : 'Failed to create group'));
      }
      saved = true;
      if (!isEdit) {
        setTitle('');
        setDescription('');
        setType(GROUP_TYPES[0].value);
        setLocation('');
        setIcon('');
        setIsPrivate(false);
        setSavedImage(null);
      } else {
        setSavedImage(uploadedUrl ?? savedImage);
      }
      setImageFile(null);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      // The upload happens before the group write, so a failed write leaves
      // the new picture orphaned unless we take it back.
      if (!saved && uploadedUrl) await discardUploadedImage(uploadedUrl);
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          isEdit
            ? `inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`
            : `inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`
        }
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={isEdit ? `Edit ${group!.title}` : 'Create group'}
      >
        {isEdit ? <Pencil className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        {isEdit ? 'Edit' : 'Create Group'}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && !imageToCrop && setOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Edit Group' : 'Create Group'}</h2>
              <button
                type="button"
                className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => !loading && !imageToCrop && setOpen(false)}
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
                  className={FIELD}
                  placeholder="Group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={FIELD}
                  placeholder="What is this group about?"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className={FIELD}>
                    {GROUP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={FIELD}
                    placeholder="Neighborhood or venue"
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div>
                  <p id="group-private-label" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Lock className="h-4 w-4 text-slate-400" aria-hidden />
                    Private group
                  </p>
                  <p id="group-private-help" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {isPrivate
                      ? 'Anyone can find the group, but only members see its discussion, polls and sign-ups. People request to join and the owner approves them.'
                      : 'Anyone can join and see the discussion, polls and sign-ups.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPrivate}
                  aria-labelledby="group-private-label"
                  aria-describedby="group-private-help"
                  onClick={() => setIsPrivate((v) => !v)}
                  className={[
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
                    isPrivate ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600',
                  ].join(' ')}
                >
                  <span
                    aria-hidden
                    className={[
                      'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                      isPrivate ? 'translate-x-5' : 'translate-x-0.5',
                    ].join(' ')}
                  />
                </button>
              </div>

              {/* Appearance */}
              <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-300">Appearance</legend>

                <div className="flex items-center gap-4">
                  {shownImage ? (
                    <img
                      src={shownImage}
                      alt="Group picture preview"
                      className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
                    />
                  ) : (
                    <span className={['flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl', tint.bg].join(' ')}>
                      {chosenIcon ? (
                        <DynamicIcon name={chosenIcon} className={['h-8 w-8', tint.color].join(' ')} aria-hidden />
                      ) : (
                        <TypeIcon className={['h-8 w-8', tint.color].join(' ')} aria-hidden />
                      )}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                      <ImagePlus className="h-4 w-4" aria-hidden />
                      {shownImage ? 'Change picture' : 'Upload picture'}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={!!imageToCrop || loading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (!f.type.startsWith('image/')) {
                            setError('Please choose an image file.');
                            e.target.value = '';
                            return;
                          }
                          setError(null);
                          setImageToCrop(URL.createObjectURL(f));
                        }}
                      />
                    </label>
                    {shownImage ? (
                      <button
                        type="button"
                        onClick={removePicture}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/30"
                      >
                        Remove picture
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Icon{shownImage ? ' (shown if the picture is removed)' : ''}
                    {chosenIcon ? <span className="text-slate-500 dark:text-slate-400"> · {iconLabel(chosenIcon)}</span> : null}
                  </p>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <label htmlFor="group-icon-search" className="sr-only">Search icons</label>
                    <input
                      id="group-icon-search"
                      type="search"
                      value={iconQuery}
                      onChange={(e) => setIconQuery(e.target.value)}
                      placeholder="Search 1,800+ icons — dog, golf, guitar, book…"
                      className={FIELD.replace('mt-1 ', '') + ' pl-9 text-sm'}
                    />
                  </div>
                  <div role="radiogroup" aria-label="Group icon" className="mt-2 grid max-h-56 grid-cols-6 gap-2 overflow-y-auto p-0.5 sm:grid-cols-8">
                    {!iconQuery.trim() ? (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!chosenIcon}
                        title="Type default"
                        aria-label="Type default"
                        onClick={() => setIcon('')}
                        className={[
                          'flex h-10 w-full items-center justify-center rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500',
                          !chosenIcon ? `${tint.bg} border-blue-600 ring-1 ring-blue-600 dark:border-blue-400 dark:ring-blue-400` : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
                        ].join(' ')}
                      >
                        <TypeIcon className={['h-5 w-5', tint.color].join(' ')} aria-hidden />
                      </button>
                    ) : null}
                    {iconResults.map((name) => {
                      const selected = chosenIcon === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          title={iconLabel(name)}
                          aria-label={iconLabel(name)}
                          onClick={() => setIcon(name)}
                          className={[
                            'flex h-10 w-full items-center justify-center rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500',
                            selected
                              ? `${tint.bg} border-blue-600 ring-1 ring-blue-600 dark:border-blue-400 dark:ring-blue-400`
                              : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
                          ].join(' ')}
                        >
                          <DynamicIcon
                            name={name}
                            className={['h-5 w-5', selected ? tint.color : 'text-slate-600 dark:text-slate-300'].join(' ')}
                            aria-hidden
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {iconQuery.trim()
                      ? iconTotal === 0
                        ? 'No icons match. Try a simpler word.'
                        : iconTotal > iconResults.length
                          ? `Showing ${iconResults.length} of ${iconTotal} matches — add a word to narrow it down.`
                          : `${iconTotal} ${iconTotal === 1 ? 'match' : 'matches'}.`
                      : "Suggestions shown. The first uses the group type's icon; icons take the type's color."}
                  </p>
                </div>
              </fieldset>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  disabled={loading || !!imageToCrop || !title.trim() || !description.trim()}
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {imageToCrop ? (
        <ProviderLogoCropDialog
          imageSrc={imageToCrop}
          title="Crop group picture"
          fileBaseName="group-picture"
          onCancel={closeCrop}
          onComplete={(file) => {
            closeCrop();
            setImageFile(file);
          }}
        />
      ) : null}
    </>
  );
}
