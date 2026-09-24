import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import { getCategoryMeta } from '@/lib/data/event-categories';
import { formatDateRange } from '@/lib/utils/date';
import RoleGate from '@/components/auth/RoleGate';
import EventFormDialog from '@/components/events/EventFormDialog';
import AdminDeleteButton from '@/components/common/AdminDeleteButton';
import CommentThread from '@/components/forum/CommentThread';
import SetBreadcrumbTitle from '@/components/common/SetBreadcrumbTitle';

export const metadata: Metadata = {
  title: 'Event • Briar Chapel Connect',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return notFound();

  const supabase = await createClient();
  type Row = Database['public']['Tables']['events']['Row'];
  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .maybeSingle<Row>();

  // maybeSingle rather than single: a missing row is a 404, not a 500. A
  // malformed uuid errors at the database, which lands here too.
  if (error || !event) return notFound();

  let groupTitle: string | null = null;
  if (event.group_id) {
    const { data: group } = await supabase
      .from('groups')
      .select('title')
      .eq('id', event.group_id)
      .maybeSingle<{ title: string }>();
    groupTitle = group?.title ?? null;
  }

  const meta = getCategoryMeta(event.category);
  const isCancelled = event.status === 'cancelled';

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <SetBreadcrumbTitle value={event.title} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={['text-xs px-2 py-0.5 rounded-full', meta.badgeClasses].join(' ')}>
                {meta.label}
              </span>
              {isCancelled ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                  Cancelled
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white break-words">
              {event.title}
            </h1>
          </div>

          {/* Hides the controls only -- PATCH and DELETE /api/events enforce admin. */}
          <RoleGate minimum="admin">
            <div className="flex items-start gap-2">
              <EventFormDialog
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  category: event.category,
                  event_date: event.event_date,
                  end_date: event.end_date,
                  location: event.location,
                  address: event.address,
                  status: event.status,
                }}
              />
              <AdminDeleteButton
                endpoint="/api/events"
                id={event.id}
                redirectTo="/events"
                noun="event"
                name={event.title}
                consequence="Its RSVPs and comments will be deleted too."
              />
            </div>
          </RoleGate>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">When</dt>
              <dd className="text-sm text-slate-900 dark:text-slate-100">
                {formatDateRange(event.event_date, event.end_date)}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Where</dt>
              <dd className="text-sm text-slate-900 dark:text-slate-100">{event.location}</dd>
              {event.address ? (
                <dd className="text-sm text-slate-600 dark:text-slate-300">{event.address}</dd>
              ) : null}
            </div>
          </div>

          {event.group_id ? (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Group</dt>
                <dd className="text-sm">
                  <Link
                    href={`/groups/${event.group_id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {groupTitle ?? 'View group'}
                  </Link>
                </dd>
              </div>
            </div>
          ) : null}
        </dl>

        {event.description ? (
          <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{event.description}</p>
          </div>
        ) : null}

        <div className="mt-10">
          <CommentThread entityType="event" entityId={event.id} />
        </div>
      </div>
    </div>
  );
}
