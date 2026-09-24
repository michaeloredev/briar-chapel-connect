import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { requireAuthSupabase } from '@/lib/supabase/auth';
import { requireRole } from '@/lib/auth/roles';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { deleteEntityComments } from '@/lib/api/comments';

type Payload = {
  title?: string;
  description?: string;
  category?: string;
  event_date?: string;
  end_date?: string | null;
  location?: string;
  address?: string | null;
  max_attendees?: number | null;
  image_url?: string | null;
  group_id?: string | null;
};

export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();
    const title = (body.title || '').trim();
    const description = (body.description || '').trim() || null;
    // 'other' matches the form's default; 'general' is not a real category.
    const category = (body.category || 'other').trim() || 'other';
    const rawStart = (body.event_date || '').trim();
    const rawEnd = (body.end_date || '')?.trim() || null;
    const location = (body.location || 'Briar Chapel').trim() || 'Briar Chapel';
    const address = (body.address || '')?.trim() || null;
    const max_attendees =
      typeof body.max_attendees === 'number' && Number.isFinite(body.max_attendees)
        ? body.max_attendees
        : null;
    const image_url = (body.image_url || '')?.trim() || null;
    const group_id = (body.group_id || '')?.trim() || null;

    if (!title) return apiBadRequest('Missing title');
    if (!rawStart) return apiBadRequest('Missing event_date');

    // Parse here so a bad date is the caller's 400, not a Postgres 500 --
    // matching what PATCH already does.
    const start = new Date(rawStart);
    if (Number.isNaN(start.getTime())) return apiBadRequest('invalid event_date');
    const end = rawEnd ? new Date(rawEnd) : null;
    if (end && Number.isNaN(end.getTime())) return apiBadRequest('invalid end_date');
    const event_date = start.toISOString();
    const end_date = end ? end.toISOString() : null;

    // An end before the start makes eventDayKeys() return an empty range, so
    // the event never appears on the calendar or in the day list. Rows created
    // before this check exist and have to be repaired by hand.
    if (end && end < start) {
      return apiBadRequest('End date and time must be after the start');
    }

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');
    // RLS grants no write on this table to anon or authenticated, so the
    // insert goes through the service role -- authorized by the check above.
    const admin = createAdminClient();
    type Insert = Database['public']['Tables']['events']['Insert'];
    const insert: Insert = {
      user_id: userId,
      title,
      description: description || '',
      category,
      event_date,
      end_date,
      location,
      address,
      max_attendees,
      status: 'upcoming',
      image_url,
      group_id,
    };

    const { data, error } = await admin
      .from('events')
      .insert(insert as any)
      .select('*')
      .single();

    if (error) {
      console.error('[Events][POST] insert error:', error.message);
      return apiError(error, 'Failed to create event');
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to create event');
  }
}

type PatchPayload = Payload & { id?: string; status?: string };

/**
 * Edit an event. Admin and above, any event -- events are community-wide
 * content that only admins can create in the first place, so the same people
 * who can post one can correct it. Matches how providers and comment
 * moderation already work.
 *
 * Only the keys present in the request body are written. Omitting a field
 * leaves it alone rather than nulling it, so a partial edit from a form that
 * does not carry every column cannot silently blank the rest of the row.
 */
export async function PATCH(req: Request) {
  try {
    const body: PatchPayload = await req.json();
    const id = (body.id || '').trim();
    if (!id) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');

    type EventUpdate = Database['public']['Tables']['events']['Update'];
    const update: EventUpdate = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) return apiBadRequest('title cannot be empty');
      update.title = title;
    }
    if (body.description !== undefined) update.description = body.description.trim();
    if (body.category !== undefined) update.category = body.category.trim() || 'other';
    if (body.location !== undefined) update.location = body.location.trim() || 'Briar Chapel';
    if (body.address !== undefined) update.address = body.address?.trim() || null;
    if (body.max_attendees !== undefined) update.max_attendees = body.max_attendees;
    if (body.image_url !== undefined) update.image_url = body.image_url;
    if (body.group_id !== undefined) update.group_id = body.group_id;
    if (body.status !== undefined) {
      const allowed = ['upcoming', 'ongoing', 'completed', 'cancelled'] as const;
      type EventStatus = (typeof allowed)[number];
      if (!(allowed as readonly string[]).includes(body.status)) {
        return apiBadRequest('invalid status');
      }
      update.status = body.status as EventStatus;
    }

    if (body.event_date !== undefined) {
      const start = new Date(body.event_date);
      if (Number.isNaN(start.getTime())) return apiBadRequest('invalid event_date');
      update.event_date = start.toISOString();
    }
    if (body.end_date !== undefined) {
      if (body.end_date === null || body.end_date === '') {
        update.end_date = null;
      } else {
        const end = new Date(body.end_date);
        if (Number.isNaN(end.getTime())) return apiBadRequest('invalid end_date');
        update.end_date = end.toISOString();
      }
    }

    if (Object.keys(update).length === 0) return apiBadRequest('No fields to update');

    const admin = createAdminClient();

    // An end before the start makes eventDayKeys() produce an empty range, so
    // the event vanishes from both the calendar and the day list. Editing only
    // one of the two dates can invert the pair just as easily as editing both,
    // so compare against the stored row rather than only what was sent.
    if (update.event_date !== undefined || update.end_date !== undefined) {
      const { data: current, error: readError } = await admin
        .from('events')
        .select('event_date, end_date')
        .eq('id', id)
        .maybeSingle<{ event_date: string; end_date: string | null }>();

      if (readError) {
        if (readError.code === '22P02') return apiBadRequest('invalid id');
        console.error('[Events][PATCH] read error:', readError.message);
        return apiError(readError, 'Failed to update event');
      }
      if (!current) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

      const start = update.event_date ?? current.event_date;
      const end = update.end_date !== undefined ? update.end_date : current.end_date;
      if (start && end && new Date(end) < new Date(start)) {
        return apiBadRequest('End date and time must be after the start');
      }
    }
    const { data, error } = await admin
      .from('events')
      .update(update as never)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      // 22P02 is an unparseable uuid: a bad id is the caller's mistake, not a
      // server fault, so it must not fall through to a 500.
      if (error.code === '22P02') return apiBadRequest('invalid id');
      console.error('[Events][PATCH] error:', error.message);
      return apiError(error, 'Failed to update event');
    }
    if (!data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    return apiError(err, 'Failed to update event');
  }
}

/**
 * Delete an event. Admin and above, any event -- the same people who can
 * create and edit one. RSVPs in event_attendees cascade through the foreign
 * key; comments have no foreign key, so their thread is removed separately
 * afterwards.
 */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) return apiBadRequest('Missing id');

    const { userId } = await requireAuthSupabase();
    await requireRole(userId, 'admin');
    const admin = createAdminClient();

    const { data: deleted, error } = await admin
      .from('events')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      if (error.code === '22P02') return apiBadRequest('invalid id');
      console.error('[Events][DELETE] error:', error.message);
      return apiError(error, 'Failed to delete event');
    }
    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await deleteEntityComments(admin, 'event', id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiError(err, 'Failed to delete event');
  }
}
