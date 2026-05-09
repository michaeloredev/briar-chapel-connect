import type { Area } from 'react-easy-crop';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('Failed to load image')));
    img.src = src;
  });
}

/**
 * Renders the given pixel crop into a square canvas and encodes as WebP (PNG fallback).
 */
export async function cropImageToSquareWebp(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 512,
  quality = 0.9,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  const encode = (type: string, q?: number) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, q);
    });

  let blob = await encode('image/webp', quality);
  if (!blob || blob.size === 0) {
    blob = await encode('image/png');
  }
  if (!blob) throw new Error('Failed to encode image');
  return blob;
}
