/**
 * One-off seed for mechanics and auto detailing near Briar Chapel.
 *
 * Weighted toward Pittsboro and the US 15-501 corridor, which is the closest
 * concentration of shops to the neighborhood.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-mechanics-auto-detailing-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'transportation-automotive/mechanics-auto-detailing';

const PROVIDERS = [
  {
    title: 'Sanders Automotive',
    summary: 'CARFAX Top Rated shop directly on US 15-501 North, rated 4.9 across 149 verified reviews',
    details:
      'Sanders Automotive sits on US Highway 15-501 North in Pittsboro, placing it directly on the corridor Briar Chapel residents already drive. It is a CARFAX Top Rated Service Center holding a 4.9 out of 5 rating across 149 verified reviews. Commonly performed work includes brake service, oil changes, safety inspections, and tire service and repair. Reviewers repeatedly describe it as a genuine dealership alternative, citing detailed pre-appointment consultations that lay out the scope of work before anything begins.',
    tags: ['15-501', 'carfax-top-rated', 'brakes', 'inspections', 'tires'],
    contact_email: null,
    contact_phone: '(919) 542-1386',
    location: 'Pittsboro, NC',
    website: 'https://www.sanders-auto.com/',
  },
  {
    title: "Chuy's Auto Repair",
    summary: 'Locally owned family shop on Sanford Road handling general repair and state inspections',
    details:
      "Chuy's Auto Repair is a locally owned family shop on Sanford Road in Pittsboro covering general maintenance and repair alongside state inspections. Reviews consistently emphasize honesty and unhurried service, with several customers noting the owner takes time to talk through work rather than rushing them, and one reporting a walk-in state inspection completed in under half an hour. The shop draws customers from across Chatham County and the surrounding communities including Chapel Hill and Carrboro. It is a good fit if you prefer a small independent shop over a chain.",
    tags: ['pittsboro', 'family-owned', 'state-inspections', 'general-repair', 'walk-ins'],
    contact_email: null,
    contact_phone: '(919) 726-2000',
    location: 'Pittsboro, NC',
    website: 'https://www.chuysautorepairchatham.com/',
  },
  {
    title: "Doug's Auto & Tire",
    summary: 'Full-service shop and tire dealer backing repairs with a 2 year, 24,000-mile nationwide warranty',
    details:
      "Doug's Auto & Tire in Pittsboro handles everything from oil changes and state inspections through complete engine replacement, and backs all repairs with a 2 year, 24,000-mile nationwide warranty. The tire inventory covers cars, trucks, and SUVs from Cooper, Michelin, and Goodyear, and the shop also sells tractor tires for the local farming community. Doug grew up in Chatham County and chose the Pittsboro location specifically for its central access, reachable from Route 15-501 for Chapel Hill and Sanford drivers and from Routes 64 and 87 for Wake and Chatham County. Service area spans Pittsboro, Moncure, Siler City, Chapel Hill, Cary, Apex, Sanford, Raleigh, and Holly Springs.",
    tags: ['nationwide-warranty', 'tires', 'engine-work', 'pittsboro', 'inspections'],
    contact_email: null,
    contact_phone: '(919) 542-5996',
    location: 'Pittsboro, NC',
    website: 'https://www.dougsautoonline.com/About',
  },
  {
    title: 'Performance Automotive & Tire',
    summary: 'Locally owned shop established in 1999, servicing hybrids and offering local drop-off and pickup',
    details:
      'Performance Automotive & Tire on East Street in Pittsboro was established in 1999 and positions itself as a dealership alternative for Pittsboro, Chapel Hill, and Apex. The shop covers routine maintenance and repair across many makes and models including all hybrid models, and also handles passenger tires and aftermarket wheels, stocking BFGoodrich, Michelin, and Uniroyal. Customers living within Pittsboro city limits can be dropped off and picked up as a courtesy. Hours are Monday through Thursday 8am to 5pm and Friday 8am to 4pm.',
    tags: ['established-1999', 'hybrid-service', 'tires', 'locally-owned', 'shuttle-service'],
    contact_email: null,
    contact_phone: '(919) 542-5614',
    location: 'Pittsboro, NC',
    website: 'https://www.performanceautomotiveandtire.com/',
  },
  {
    title: '501 Auto Detailing',
    summary: 'Car wash and detailing shop on US 15-501 between the Pittsboro circle and Chapel Hill',
    details:
      '501 Auto Detailing operates from US Highway 15-501 North in Pittsboro, sitting between the Pittsboro circle and Chapel Hill just south of Fearrington Village, which makes it the most convenient detailer to Briar Chapel. Three packages are offered: exterior detail, interior detail, and a combined full detail service. Exterior work starts with a foam cannon bath to lift dirt away from the paint before buffing minor scratches and finishing with polymer liquid wax. Interior service covers carpet vacuuming, floor mats, dash, seats, cupholders, and windows. Paint correction and ceramic coating can be added, with protection quoted up to five years. Hours are Monday through Thursday 8 to 5, Friday 8 to 4, and Saturday 8 to 2 by appointment.',
    tags: ['detailing', '15-501', 'ceramic-coating', 'paint-correction', 'car-wash'],
    contact_email: null,
    contact_phone: '(919) 246-6129',
    location: 'Pittsboro, NC',
    website: 'https://www.501detailing.com/',
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
