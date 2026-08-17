/**
 * One-off seed for taxi and shuttle providers serving Briar Chapel.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-taxi-shuttle-services-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'transportation-automotive/taxi-shuttle-services';

const PROVIDERS = [
  {
    title: 'Chatham Transit Network',
    summary: 'Chatham County nonprofit running curb-to-curb rides and fixed routes to Chapel Hill from $2',
    details:
      'Chatham Transit Network is a local non-profit providing public transportation throughout Chatham County, with fares starting at $2.00 each way for trips up to 3 miles and scaling to $7.00 for 10 to 13 miles. It runs two fixed routes, the PX Route and the 64 Route, giving regular weekday service between Siler City, Pittsboro, and Chapel Hill. It also operates an In-County Service providing curb-to-curb rides to and from any location in Chatham County, available 4am to 6pm daily, with reservations required at least 48 hours in advance. Monday requests must be in by noon the previous Thursday and Tuesday requests by noon the previous Friday. Vehicles are lift-equipped and accessible, and staff are screened and trained. The office on Dr. Martin Luther King Jr. Drive in Pittsboro is open weekdays 8am to 5pm.',
    tags: ['nonprofit', 'chatham-county', 'accessible', 'low-cost', 'curb-to-curb'],
    contact_email: null,
    contact_phone: '(919) 542-5136',
    location: 'Pittsboro, NC',
    website: 'https://chathamtransit.org/',
  },
  {
    title: 'Carolina Sedan Service',
    summary: 'Private black car service serving Pittsboro and RDU since 2008, bookable 24/7 by call or text',
    details:
      'Carolina Sedan Service has provided private black car transportation around Chapel Hill, Carrboro, Durham, Raleigh, and RDU since 2008, and lists Pittsboro in its service area. Beyond airport transfers it handles medical and senior rides with reliable pickup windows, university travel for UNC and Duke visitors, and corporate and event service including hourly private drivers. Airport work includes meet-and-greet, luggage handling, and pickup times planned around your flight. Rides before 6am or after 10pm start around a $75 estimate. The office is on Colony Woods Drive in Chapel Hill and the company can be reached by call or text at any hour.',
    tags: ['black-car', 'rdu-transfers', 'senior-rides', 'corporate', 'since-2008'],
    contact_email: 'booking@carolinasedan.com',
    contact_phone: '(919) 924-0568',
    location: 'Chapel Hill, NC',
    website: 'https://carolinasedan.com/',
  },
  {
    title: 'Chapel Hill Taxi & Airport Car Service',
    summary: 'Triangle-wide taxi and car service operating 24/7 since 2003, including handicap transportation',
    details:
      'Chapel Hill Taxi & Airport Car Service has served the Triangle since 2003 from the Hayes Building on Raleigh Road, covering Chapel Hill, Raleigh, Durham, Cary, and RDU Airport. Services extend past standard airport transfers to include corporate travel, special events, wedding limousine service, experiential city tours, handicap transportation, and nationwide transportation. The company operates 24 hours a day, seven days a week, including all holidays, with a separate booking line and office line.',
    tags: ['24-7', 'rdu-transfers', 'handicap-accessible', 'limousine', 'since-2003'],
    contact_email: 'Booking@chapelhilltaxi.com',
    contact_phone: '(919) 933-9595',
    location: 'Chapel Hill, NC',
    website: 'https://chapelhilltaxi.com/',
  },
  {
    title: 'My RDU Airport Shuttle',
    summary: 'Flat-rate RDU shuttle specializing in early morning pickups, with group vehicles up to 57 passengers',
    details:
      'My RDU Airport Shuttle provides flat-rate, point-to-point shuttle transportation across the Raleigh-Durham and Chapel Hill regions with no surge pricing. The company specializes in early morning pickups and states that a 4am ride is as certain as a 4pm one, which suits catching first departures out of RDU. It handles individuals through groups of up to 57 passengers and also covers airport-to-airport transfers and luxury limousine service. Note that there is no counter on airport property, so travelers are asked to call on arrival; the company also sends a courtesy call or text once your flight lands if you provide airline and flight number when booking. Reservations can be made online, by phone, or by text, and the line is staffed 24/7.',
    tags: ['flat-rate', 'early-morning', 'group-transport', '24-7', 'rdu'],
    contact_email: null,
    contact_phone: '(919) 728-0195',
    location: 'Chapel Hill, NC',
    website: 'https://www.myrduairportshuttle.com/',
  },
  {
    title: 'Yellow Chapel Hill RDU Taxi Cab',
    summary: 'Door-to-door taxi with published flat rates to RDU, serving Chapel Hill, Carrboro, and Pittsboro',
    details:
      'Yellow Chapel Hill RDU Taxi Cab runs door-to-door taxi service covering Chapel Hill, Carrboro, and Pittsboro, along with RDU airport pickups and drop-offs and out-of-town trips, operating 24 hours a day seven days a week. The company publishes specific flat rates to RDU rather than quoting on request, listing fares such as $44.95 from UNC and $49.95 from downtown Chapel Hill or UNC Hospital, though rates are subject to change. Rides can be booked through an online form or by phone.',
    tags: ['flat-rate', 'rdu', '24-7', 'pittsboro', 'door-to-door'],
    contact_email: null,
    contact_phone: '(919) 928-5238',
    location: 'Chapel Hill, NC',
    website: 'https://yellowcabchapelhillrdutaxi.com/',
  },
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

async function resolveOwnerUserId(supabase) {
  const fromEnv = process.env.SEED_OWNER_USER_ID?.trim();
  if (fromEnv) return fromEnv;

  const { data, error } = await supabase.from('user_roles').select('user_id').eq('role', 'superadmin');

  if (error) {
    console.error(`Could not look up a superadmin: ${error.message}`);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.error('No superadmin found in user_roles. Set SEED_OWNER_USER_ID to a Clerk user ID.');
    process.exit(1);
  }
  if (data.length > 1) {
    console.error(
      `Found ${data.length} superadmins. Set SEED_OWNER_USER_ID to pick one:\n` +
        data.map((r) => `  ${r.user_id}`).join('\n'),
    );
    process.exit(1);
  }

  console.log(`Owner: ${data[0].user_id} (only superadmin in user_roles)\n`);
  return data[0].user_id;
}

async function main() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ownerUserId = await resolveOwnerUserId(supabase);

  let inserted = 0;
  let skipped = 0;

  for (const provider of PROVIDERS) {
    const { data: existing, error: lookupError } = await supabase
      .from('services')
      .select('id')
      .eq('category', CATEGORY)
      .eq('title', provider.title)
      .maybeSingle();

    if (lookupError) {
      console.error(`Lookup failed for "${provider.title}": ${lookupError.message}`);
      process.exitCode = 1;
      continue;
    }

    if (existing) {
      console.log(`skip    ${provider.title} (already exists)`);
      skipped += 1;
      continue;
    }

    const { error: insertError } = await supabase.from('services').insert({
      user_id: ownerUserId,
      title: provider.title,
      summary: provider.summary,
      details: provider.details,
      category: CATEGORY,
      tags: provider.tags,
      contact_email: provider.contact_email,
      contact_phone: provider.contact_phone,
      location: provider.location,
      website: provider.website,
      status: 'active',
      image_url: null,
    });

    if (insertError) {
      console.error(`Insert failed for "${provider.title}": ${insertError.message}`);
      process.exitCode = 1;
      continue;
    }

    console.log(`insert  ${provider.title}`);
    inserted += 1;
  }

  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
