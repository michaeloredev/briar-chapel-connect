import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import EventCalendar from '@/components/events/EventCalendar';
import EventList from '@/components/events/EventList';
import { SignedIn } from '@clerk/nextjs';
import AddEventButton from '@/components/events/AddEventButton';
import { PageHeader } from '@/components/common/PageHeader';
import RoleGate from '@/components/auth/RoleGate';
import { formatLocalDate, isValidYM, isValidYMD, parseYM } from '@/lib/utils/date';

export const metadata: Metadata = {
  title: 'Events • Briar Chapel Connect',
  description: 'Discover community events in Briar Chapel',
};

type SearchParams = Promise<{ date?: string; month?: string }>;

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const { date, month } = await searchParams;

  // The URL is the single source of truth for both the selected day and the
  // month on screen, so the calendar and the list can never disagree.
  // These server-side defaults only cover the first paint; EventCalendar
  // rewrites the URL on mount when the viewer's "today" differs from ours.
  const selectedYMD = isValidYMD(date) ? date : formatLocalDate(new Date());
  const viewedYM = isValidYM(month) ? month : selectedYMD.slice(0, 7);

  // Fetch a window around the month on screen so its dots are populated.
  const { year, month: monthIndex } = parseYM(viewedYM);
  const start = new Date(year, monthIndex - 1, 1);
  const end = new Date(year, monthIndex + 2, 0, 23, 59, 59, 999);

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

  const events = (rows ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.event_date,
    endDate: e.end_date ?? null,
    location: e.location,
    status: e.status,
    category: e.category,
  }));

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          title="Community Events"
          description="Find yard sales, meetups, and local happenings."
          actions={
            <SignedIn>
              <RoleGate minimum="admin">
                <AddEventButton />
              </RoleGate>
            </SignedIn>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <EventCalendar selectedYMD={selectedYMD} viewedYM={viewedYM} events={events} />
          </div>
          <div>
            <EventList selectedYMD={selectedYMD} events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
