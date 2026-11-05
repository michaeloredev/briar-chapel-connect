import { NextResponse } from 'next/server';
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { apiError, apiBadRequest } from '@/lib/api/response';

/**
 * Images live in a single Cloudflare R2 bucket. Each logical "bucket" the
 * routes name (comment-images, service-images, ...) is a top-level prefix in
 * it, so an object's R2 key is `${bucket}/${path}` and its public URL is
 * `${R2_PUBLIC_URL}/${bucket}/${path}`. Callers only ever see `path`
 * (`${userId}/${uuid}.${ext}`), the same shape Supabase Storage used.
 */
type R2Config = { client: S3Client; bucket: string };

let r2: R2Config | null = null;

function r2Config(): R2Config {
  if (r2) return r2;
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicUrl = r2PublicUrl();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error('R2 storage is not configured (R2_* env vars missing)');
  }
  r2 = {
    client: new S3Client({
      region: 'auto',
      endpoint: r2Endpoint(accountId),
      credentials: { accessKeyId, secretAccessKey },
      // Cloudflare's recommended setting: only send checksums the API requires.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    }),
    bucket,
  };
  return r2;
}

/**
 * R2_ACCOUNT_ID may be the bare account ID or the "S3 API" URL the dashboard
 * shows beside it (which can carry a trailing /bucket); accept either.
 */
function r2Endpoint(accountId: string): string {
  if (!accountId.includes('://')) return `https://${accountId}.r2.cloudflarestorage.com`;
  return new URL(accountId).origin;
}

function r2PublicUrl(): string {
  return (process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
}

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
 * Handles a file upload POST request, storing the image under `bucket` in R2.
 * Expects a FormData body with a "file" field.
 */
export async function handleFileUpload(req: Request, bucket: string): Promise<NextResponse> {
  try {
    let config: R2Config;
    try {
      config = r2Config();
    } catch (err) {
      return apiError(err, 'File upload is not configured on the server');
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return apiBadRequest('Missing file');
    if (file.size <= 0) return apiBadRequest('Empty file');
    if (file.size > MAX_UPLOAD_BYTES) {
      return apiBadRequest('Image must be 2MB or smaller');
    }

    const { userId } = await requireAuthSupabase();

    const arrayBuffer = await file.arrayBuffer();
    const detectedType = detectImageType(new Uint8Array(arrayBuffer));
    if (!detectedType) {
      return apiBadRequest('Only JPEG, PNG, and WebP images are allowed');
    }

    const ext = IMAGE_EXTENSIONS[detectedType];
    const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;

    try {
      await config.client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: `${bucket}/${fileName}`,
          Body: new Uint8Array(arrayBuffer),
          ContentType: detectedType,
          // Names are random UUIDs and never overwritten, so cache forever.
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } catch (uploadError) {
      const detail = uploadError instanceof Error ? uploadError.message : 'Unknown storage error';
      console.error(`[Upload][${bucket}] error:`, detail);
      return apiError(new Error(detail), `Failed to upload file: ${detail}`);
    }

    // Read fresh rather than cached, so it always matches publicImagePath().
    const url = `${r2PublicUrl()}/${bucket}/${fileName}`;
    return NextResponse.json({ url, path: fileName }, { status: 200 });
  } catch (err) {
    return apiError(err, 'Failed to upload file');
  }
}

/**
 * A path is safe when every segment is a real name. Rejecting `..`, `.` and
 * empty segments keeps the `${userId}/` ownership check in handleFileDelete
 * meaningful: `user/../other/x` starts with `user/` but is not theirs.
 */
function safePath(path: string): string | null {
  if (!path || path.includes('\\')) return null;
  return path.split('/').every((seg) => seg !== '' && seg !== '.' && seg !== '..') ? path : null;
}

/** Decodes the object path after `prefix` in `value`, dropping any query string. */
function pathAfter(value: string, prefix: string): string | null {
  if (!value.startsWith(prefix)) return null;
  const raw = value.slice(prefix.length).split(/[?#]/)[0];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // keep the raw form
  }
  return safePath(decoded);
}

/** R2 folders whose Supabase Storage bucket had a different name. */
const LEGACY_SUPABASE_BUCKETS: Record<string, string> = {
  'service-images': 'provider-logos',
};

/**
 * The object path of a full public image URL this app issued for `bucket`,
 * or null for anything else. Use this to validate a client-supplied URL.
 *
 * Accepts R2 URLs, and legacy Supabase Storage URLs so rows written before the
 * move to R2 still validate. Legacy objects are not deleted from Supabase when
 * their row goes; that is acceptable for dev data, and production starts on R2.
 */
export function publicImagePath(url: string, bucket: string): string | null {
  const value = (url || '').trim();
  const publicUrl = r2PublicUrl();
  if (publicUrl) {
    const path = pathAfter(value, `${publicUrl}/${bucket}/`);
    if (path) return path;
  }
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (supabaseUrl) {
    const legacyBucket = LEGACY_SUPABASE_BUCKETS[bucket] ?? bucket;
    const path = pathAfter(value, `${supabaseUrl}/storage/v1/object/public/${legacyBucket}/`);
    if (path) return path;
  }
  return null;
}

/**
 * Turns a stored public URL or raw object path into a storage object path.
 * Returns null when the value does not belong to the given bucket.
 */
export function storageObjectPath(ref: string, bucket: string): string | null {
  const value = (ref || '').trim();
  if (!value) return null;
  if (value.includes('://')) return publicImagePath(value, bucket);
  return safePath(value);
}

/**
 * Objects under this prefix are catalog assets (the provider logos the
 * provider_catalog migration points at), shared by every environment that
 * uses the bucket. They are never deleted, so removing a provider in dev
 * cannot break the same provider's logo in production.
 */
const SHARED_PREFIX = 'catalog/';

/** Best-effort delete of storage objects. Logs and continues on failure. */
export async function removeStorageObjects(bucket: string, paths: string[]): Promise<void> {
  const unique = [
    ...new Set(paths.map((p) => p.trim()).filter((p) => p && !p.startsWith(SHARED_PREFIX))),
  ];
  if (unique.length === 0) return;

  let config: R2Config;
  try {
    config = r2Config();
  } catch (err) {
    console.error(`[Storage][${bucket}] skip remove:`, err instanceof Error ? err.message : err);
    return;
  }

  // DeleteObjects takes at most 1000 keys per request.
  for (let i = 0; i < unique.length; i += 1000) {
    try {
      const result = await config.client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucket,
          Delete: { Objects: unique.slice(i, i + 1000).map((p) => ({ Key: `${bucket}/${p}` })), Quiet: true },
        }),
      );
      for (const e of result.Errors ?? []) {
        console.error(`[Storage][${bucket}] remove error:`, e.Key, e.Message);
      }
    } catch (err) {
      console.error(`[Storage][${bucket}] remove error:`, err instanceof Error ? err.message : err);
    }
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
