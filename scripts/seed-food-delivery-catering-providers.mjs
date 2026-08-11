/**
 * One-off seed for catering and food delivery providers near Briar Chapel.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-food-delivery-catering-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'food-hospitality/food-delivery-catering';

const PROVIDERS = [
  {
    title: 'The Catering Company of Chapel Hill',
    summary: "The Triangle's oldest continually operating caterer, established in 1980",
    details:
      'Established in 1980, The Catering Company of Chapel Hill is the oldest continually operating caterer in the Triangle, with more than four decades of events behind it. The company handles full-service catering and event management for weddings, corporate gatherings, university events, and celebrations of all sizes across the Triangle and throughout North Carolina. Its chefs and event planners work with clients to build both a menu and a service style, and the team also covers beverages and event decor. It suits clients who want a single vendor managing the details rather than coordinating several.',
    tags: ['full-service', 'weddings', 'corporate', 'event-management', 'established-1980'],
    contact_email: null,
    contact_phone: '(919) 929-4775',
    location: 'Chapel Hill, NC',
    website: 'https://www.thecateringcompanych.com/',
  },
  {
    title: '39 West Catering',
    summary: 'Pittsboro caterer launched in 2015, on the Chatham County approved caterer list',
    details:
      '39 West Catering was launched in 2015 by Executive Chef Greg Lewis and his wife Maria Parker-Lewis, and is based in Pittsboro. The team specializes in flexible, creative catering across a wide range of cuisines and dietary needs, handling everything from live stations to boxed lunches to afternoon snacks for weddings, corporate events, and family milestones. Services include bartending, table settings, and complimentary cake cutting. The same owners also run The Sycamore at Chatham Mills and Forest Hall, both in downtown Pittsboro, and are active supporters of Chatham County business and non-profit communities. The company appears on the Chatham County approved caterer list.',
    tags: ['pittsboro', 'weddings', 'corporate', 'chatham-county', 'bartending'],
    contact_email: null,
    contact_phone: '(919) 542-2432',
    location: 'Pittsboro, NC',
    website: 'https://39westcatering.com/',
  },
  {
    title: 'Beau Catering',
    summary: 'Full-service catering and meal delivery on Weaver Dairy Road in Chapel Hill',
    details:
      'Beau Catering operates from Weaver Dairy Road in Chapel Hill as a full-service catering and meal delivery company. It serves Chapel Hill, Durham, Hillsborough, and surrounding areas in the Triangle. The combination of event catering and meal delivery under one roof makes it a fit for both one-off gatherings and recurring food needs.',
    tags: ['full-service', 'meal-delivery', 'chapel-hill', 'events', 'local'],
    contact_email: null,
    contact_phone: '(984) 312-5485',
    location: 'Chapel Hill, NC',
    website: 'https://www.beaucatering.com/main',
  },
  {
    title: 'The Root Cellar Cafe & Catering',
    summary: 'Scratch-made catering from a cafe with locations in both Chapel Hill and Pittsboro',
    details:
      'The Root Cellar Cafe & Catering runs two locations, one on Martin Luther King Jr. Boulevard in Chapel Hill and one at Penguin Place on Suttles Road in Pittsboro, which puts it on both sides of Briar Chapel. Everything is scratch-made, with sandwiches, soups, salads, and desserts built from North Carolina farm ingredients wherever possible. The Chapel Hill cafe serves daily from 8am to 3pm, while the Pittsboro location runs lunch Wednesday through Friday, dinner Thursday through Saturday, and Sunday brunch. The catering arm handles events alongside the cafes, and it appears on the Chatham County approved caterer list.',
    tags: ['scratch-made', 'local-farms', 'two-locations', 'pittsboro', 'cafe'],
    contact_email: null,
    contact_phone: '(919) 967-3663',
    location: 'Chapel Hill, NC',
    website: 'https://rootcellarchapelhill.com/',
  },
  {
    title: 'Mediterranean Deli, Bakery & Catering',
    summary: 'Long-running West Franklin Street deli with a large catering operation',
    details:
      'Mediterranean Deli on West Franklin Street in Chapel Hill pairs a well-established deli and bakery with a substantial catering operation, and is one of the better-known catering names in town. The menu is built around Mediterranean and Middle Eastern dishes, which makes it a strong option for groups with vegetarian and vegan guests to accommodate. It is included on the Chatham County approved caterer list, so it can serve events at Chatham County venues near Briar Chapel.',
    tags: ['mediterranean', 'vegetarian-friendly', 'bakery', 'chapel-hill', 'chatham-approved'],
    contact_email: null,
    contact_phone: '(919) 967-2666',
    location: 'Chapel Hill, NC',
    website: 'https://www.mediterraneandeli.com/',
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
