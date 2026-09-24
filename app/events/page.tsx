import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import EventCalendar from '@/components/events/EventCalendar';
import EventList from '@/components/events/EventList';
import { SignedIn } from '@clerk/nextjs';
import EventFormDialog from '@/components/events/EventFormDialog';
import { PageHeader } from '@/components/common/PageHeader';
import RoleGate from '@/components/auth/RoleGate';
import { addDays, isValidYM, isValidYMD, parseYM, siteDayStart, siteToday } from '@/lib/utils/date';

export const metadata: Metadata = {
  title: 'Events • Briar Chapel Connect',
  description: 'Discover community events in Briar Chapel',
};

type SearchParams = Promise<{ date?: string; month?: string }>;

/** First day (YYYY-MM-DD) of the month `delta` months from `ym`. */
function monthStart(ym: string, delta: number): string {
  const { year, month } = parseYM(ym);
  const d = new Date(Date.UTC(year, month + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const { date, month } = await searchParams;

  // The URL is the single source of truth for both the selected day and the
  // month on screen, so the calendar and the list can never disagree. With
  // no day in the URL, "today" is Briar Chapel's today -- the same on the
  // server and in every browser, so nothing needs correcting after load.
  const selectedYMD = isValidYMD(date) ? date : siteToday();
  const viewedYM = isValidYM(month) ? month : selectedYMD.slice(0, 7);

  // Load a window around the month on screen so its dots are populated,
  // stretched to cover the selected day: paging months away from it must not
  // leave its list reading "No events scheduled" for want of data.
  // Keys are YYYY-MM-DD, so string order is date order.
  const from = [monthStart(viewedYM, -1), selectedYMD].sort()[0];
  const until = [monthStart(viewedYM, 2), addDays(selectedYMD, 1)].sort()[1];
  const fromISO = siteDayStart(from).toISOString();
  const untilISO = siteDayStart(until).toISOString();

  // Overlap, not start date: an event that began before the window but is
  // still running inside it belongs on these days too.
  const supabase = await createClient();
  type Row = Database['public']['Tables']['events']['Row'];
  const { data: rows, error } = await supabase
    .from('events')
    .select('*')
    .lt('event_date', untilISO)
    .or(`end_date.gte."${fromISO}",and(end_date.is.null,event_date.gte."${fromISO}")`)
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
    // Carried so the edit form can round-trip it; without it an edit from the
    // day list would submit a blank address and wipe the stored one.
    address: e.address ?? null,
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
                <EventFormDialog />
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
