'use client';

import * as React from 'react';

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
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      const images: string[] = [];
      if (files && files.length > 0) {
        setUploading(true);
        for (const file of Array.from(files).slice(0, 5)) {
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
        setUploading(false);
      }
      await onSubmit(value.trim(), images);
      setValue('');
      setFiles(null);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
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
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:file:bg-slate-700"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Up to 5 images. JPG/PNG/WebP recommended.</p>
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
  );
}


