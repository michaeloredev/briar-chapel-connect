import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import EventCalendar from '@/components/events/EventCalendar';
import EventList from '@/components/events/EventList';

export const metadata: Metadata = {
  title: 'Events • Briar Chapel Connect',
  description: 'Discover community events in Briar Chapel',
};

type SearchParams = Promise<{ date?: string }>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const { date } = await searchParams;
  const initialDate = (() => {
    const d = date ? new Date(date) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  })();

  // Fetch events in a reasonable window around the current month
  const start = new Date(initialDate.getFullYear(), initialDate.getMonth() - 1, 1);
  const end = new Date(initialDate.getFullYear(), initialDate.getMonth() + 2, 0, 23, 59, 59, 999);
  const supabase = await createClient();
  type Row = Database['public']['Tables']['events']['Row'];
  const { data: rows, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', start.toISOString())
    .lte('event_date', end.toISOString())
    .order('event_date', { ascending: true })
    .returns<Row[]>();
  if (error) {
    // Non-fatal: fall back to empty
    console.error('Failed to load events:', error.message);
  }

  const events =
    (rows ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.event_date,
      endDate: e.end_date ?? null,
      location: e.location,
      status: e.status,
    })) ?? [];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Community Events</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Find yard sales, meetups, and local happenings.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <EventCalendar initialDateISO={initialDate.toISOString()} />
          </div>
          <div className="md:col-span-2">
            <EventList initialDateISO={initialDate.toISOString()} events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
