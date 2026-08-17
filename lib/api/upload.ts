import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';

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

    const { userId } = await requireAuthSupabase();
    const admin = createAdminClient();

    const ext = (file.name?.split('.').pop() || 'webp').toLowerCase();
    const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(fileName, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error(`[Upload][${bucket}] error:`, uploadError.message);
      const hint =
        uploadError.message?.toLowerCase().includes('bucket') ||
        uploadError.message?.toLowerCase().includes('not found')
          ? ' Create the bucket in Supabase (Dashboard → Storage, or run the provider-logos / marketplace-images section in supabase-schema.sql).'
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
