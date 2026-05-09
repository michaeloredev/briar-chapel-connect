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
