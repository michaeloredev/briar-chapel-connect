'use client';

import * as React from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X } from 'lucide-react';
import { cropImageToSquareWebp } from '@/lib/images/cropImageToSquareWebp';

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (file: File) => void;
  title?: string;
  outputSize?: number;
  fileBaseName?: string;
};

export function ProviderLogoCropDialog({
  imageSrc,
  onCancel,
  onComplete,
  title = 'Crop logo',
  outputSize = 512,
  fileBaseName = 'provider-logo',
}: Props) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const croppedPixelsRef = React.useRef<Area | null>(null);
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onCropComplete = React.useCallback((_area: Area, areaPixels: Area) => {
    croppedPixelsRef.current = areaPixels;
  }, []);

  async function handleApply() {
    const pixels = croppedPixelsRef.current;
    if (!pixels) {
      setError('Adjust the crop area, then try again.');
      return;
    }
    setApplying(true);
    setError(null);
    try {
      const blob = await cropImageToSquareWebp(imageSrc, pixels, outputSize, 0.9);
      const mime = blob.type || 'image/webp';
      const ext = mime.includes('png') ? 'png' : 'webp';
      const file = new File([blob], `${fileBaseName}.${ext}`, { type: mime });
      onComplete(file);
    } catch {
      setError('Could not process the image. Try a different file.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logo-crop-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60" onClick={() => !applying && onCancel()} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 id="logo-crop-title" className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => !applying && onCancel()}
            aria-label="Close crop dialog"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="px-4 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Drag to reposition. Pinch or scroll to zoom. Output is a {outputSize}×{outputSize} square for crisp
            thumbnails.
          </p>
          <div className="relative h-64 w-full rounded-lg overflow-hidden bg-slate-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-3">
            <label htmlFor="logo-crop-zoom" className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Zoom
            </label>
            <input
              id="logo-crop-zoom"
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-1 block w-full accent-blue-600"
            />
          </div>
        </div>

        {error && (
          <p className="px-4 pt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2 px-4 py-4">
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            onClick={() => !applying && onCancel()}
            disabled={applying}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            onClick={() => void handleApply()}
            disabled={applying}
          >
            {applying ? 'Processing…' : 'Use crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
