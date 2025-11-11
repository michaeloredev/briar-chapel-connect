import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type Payload = {
  category?: string;
  service?: string;
  name?: string;
  summary?: string;
  details?: string;
  tags?: string[];
  contact_email?: string | null;
  contact_phone?: string | null;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const category = (body.category || '').trim();
    const service = (body.service || '').trim();
    const name = (body.name || '').trim();
    const summary = (body.summary || '').trim();
    const details = (body.details || '').trim();
    const contact_email = body.contact_email ?? null;
    const contact_phone = body.contact_phone ?? null;

    if (!category || !service || !name) {
      return NextResponse.json(
        { error: 'category, service, and name are required' },
        { status: 400 }
      );
    }

    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Clerk session token (recommended). Configure Supabase External JWT with Clerk JWKS.
    const sessionToken = await getToken();
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase: SupabaseClient<Database> = await createClient(sessionToken);
    type ServiceInsert = Database['public']['Tables']['services']['Insert'];
    const insert: ServiceInsert = {
      user_id: userId,
      title: name,
      description: details || summary || '',
      category: `${category}/${service}`,
      price_range: null,
      contact_email,
      contact_phone,
      location: 'Briar Chapel',
      status: 'active',
      image_url: null,
    };

    const { data, error } = await supabase
      .from('services')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Create provider error:', err);
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}
