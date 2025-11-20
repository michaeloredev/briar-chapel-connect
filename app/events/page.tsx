import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';
import EventCalendar from '@/components/events/EventCalendar';
import EventList from '@/components/events/EventList';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import AddEventButton from '@/components/events/AddEventButton';

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
      category: e.category,
    })) ?? [];

  // Use local date (YYYY-MM-DD in viewer's TZ) for calendar dot keys to avoid UTC off-by-one
  const toLocalYMD = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const initialYMD = toLocalYMD(initialDate.toISOString());

  const dayCategories: Record<string, string[]> = {};
  for (const e of events) {
    const iso = toLocalYMD(e.date);
    const cats = dayCategories[iso] || [];
    const val = (e.category || 'other').trim() || 'other';
    if (!cats.includes(val)) {
      if (cats.length < 3) cats.push(val);
      dayCategories[iso] = cats;
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Community Events</h1>
          <div>
            <SignedIn>
              <AddEventButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Add Event
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6">Find yard sales, meetups, and local happenings.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <EventCalendar initialDateYMD={initialYMD} dayCategories={dayCategories} />
          </div>
          <div>
            <EventList initialDateYMD={initialYMD} events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
