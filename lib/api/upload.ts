import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

type AllowedImageType = keyof typeof IMAGE_EXTENSIONS;

function detectImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/**
 * Handles a file upload POST request for a given Supabase Storage bucket.
 * Expects a FormData body with a "file" field.
 */
export async function handleFileUpload(req: Request, bucket: string): Promise<NextResponse> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return apiError(
        new Error('SUPABASE_SERVICE_ROLE_KEY is not set'),
        'File upload is not configured on the server',
      );
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return apiBadRequest('Missing file');
    if (file.size <= 0) return apiBadRequest('Empty file');
    if (file.size > MAX_UPLOAD_BYTES) {
      return apiBadRequest('Image must be 2MB or smaller');
    }

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();

    const arrayBuffer = await file.arrayBuffer();
    const detectedType = detectImageType(new Uint8Array(arrayBuffer));
    if (!detectedType) {
      return apiBadRequest('Only JPEG, PNG, and WebP images are allowed');
    }

    const ext = IMAGE_EXTENSIONS[detectedType];
    const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: detectedType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`[Upload][${bucket}] error:`, uploadError.message);
      const hint =
        uploadError.message?.toLowerCase().includes('bucket') ||
        uploadError.message?.toLowerCase().includes('not found')
          ? ' Create the bucket in Supabase (Dashboard → Storage, or run `npm run db:push` — the baseline migration creates all three buckets).'
          : '';
      const detail = `${uploadError.message || 'Unknown storage error'}${hint}`;
      return apiError(new Error(detail), `Failed to upload file: ${detail}`);
    }

    const { data } = await admin.storage.from(bucket).getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl, path: fileName }, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to upload file');
  }
}

/**
 * Turns a stored public URL or raw object path into a storage object path.
 * Returns null when the value does not belong to the given bucket.
 */
export function storageObjectPath(ref: string, bucket: string): string | null {
  const value = (ref || '').trim();
  if (!value) return null;

  const publicPrefix = `/storage/v1/object/public/${bucket}/`;
  const publicIdx = value.indexOf(publicPrefix);
  if (publicIdx !== -1) {
    const raw = value.slice(publicIdx + publicPrefix.length).split('?')[0];
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  if (!value.includes('://') && !value.startsWith('/')) {
    return value;
  }

  return null;
}

/** Best-effort delete of storage objects. Logs and continues on failure. */
export async function removeStorageObjects(bucket: string, paths: string[]): Promise<void> {
  const unique = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  if (unique.length === 0) return;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error(`[Storage][${bucket}] skip remove: SUPABASE_SERVICE_ROLE_KEY is not set`);
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove(unique);
  if (error) {
    console.error(`[Storage][${bucket}] remove error:`, error.message);
  }
}

/**
 * Delete an object the caller uploaded.
 *
 * Exists so a client can undo its own upload: the provider form uploads the
 * logo before writing the row, so a failed write would otherwise leave the file
 * in the bucket with nothing referencing it and no way to reach it.
 *
 * Deletes are confined to the caller's own `${userId}/` prefix, which is the
 * same boundary the storage policies enforce, so this cannot be used to remove
 * another user's file even though it runs under the service role.
 */
export async function handleFileDelete(req: Request, bucket: string): Promise<NextResponse> {
  try {
    const { userId } = await requireAuthSupabase();

    const url = new URL(req.url);
    const ref = (url.searchParams.get('url') || url.searchParams.get('path') || '').trim();
    if (!ref) return apiBadRequest('Missing url');

    const path = storageObjectPath(ref, bucket);
    if (!path) return apiBadRequest('Not an object in this bucket');
    if (!path.startsWith(`${userId}/`)) {
      // Matches the storage policies: a caller owns only their own prefix.
      throw new Error('Forbidden');
    }

    await removeStorageObjects(bucket, [path]);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete upload');
  }
}
