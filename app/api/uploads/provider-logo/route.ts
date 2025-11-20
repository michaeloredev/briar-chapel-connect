import { NextResponse } from 'next/server';
import { requireAuthSupabase } from '@/lib/supabase/auth';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const { supabase, userId } = await requireAuthSupabase();

    const ext = (file.name?.split('.').pop() || 'webp').toLowerCase();
    const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('provider-logos')
      .upload(fileName, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message || 'Failed to upload file' }, { status: 500 });
    }

    const { data } = await supabase.storage.from('provider-logos').getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl, path: fileName }, { status: 200 });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}


