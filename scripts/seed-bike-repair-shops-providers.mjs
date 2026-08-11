/**
 * One-off seed for bike shops serving Briar Chapel.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-bike-repair-shops-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'transportation-automotive/bike-repair-shops';

const PROVIDERS = [
  {
    title: 'The Bicycle Chain - Chapel Hill',
    summary: 'West Franklin Street shop handling suspension rebuilds, custom wheel building, and frame overhauls',
    details:
      'The Bicycle Chain on West Franklin Street in Chapel Hill goes well past standard tune-ups, offering suspension rebuilds and frame overhauls for Specialized and Cannondale full-suspension bikes, custom wheel building, disc brake service, and hub and pedal overhauls at sealed-bearing spec. Brands carried include Specialized, Cannondale, Gazelle, Benno, Surly, Juliana, 45NRTH, and Teravail, with components from Shimano and SRAM. The shop also assembles bikes bought elsewhere, with a standard fee of $150 and $260 for e-bikes, and runs a calendar of group rides and local cycling events. Hours are Monday through Friday 11am to 7pm, Saturday 10am to 6pm, and Sunday noon to 5pm.',
    tags: ['suspension-service', 'custom-wheels', 'full-service', 'group-rides', 'chapel-hill'],
    contact_email: null,
    contact_phone: '(919) 929-0213',
    location: 'Chapel Hill, NC',
    website: 'https://thebicyclechain.com/',
  },
  {
    title: 'The Clean Machine',
    summary: 'Carrboro shop with certified technicians, a Flat Club membership, and a bike trade-in program',
    details:
      'The Clean Machine on West Main Street in Carrboro is part of a four-location operation across Chapel Hill and the wider Triangle. Certified technicians handle tune-ups and repairs, and the shop carries Surly bikes. Two things set it apart: a Flat Club membership that covers flat-tire fixes free for the life of the bike, and a trade-in program for old bicycles. The shop also hosts group rides, clinics, and special events announced through its email list. Hours vary, so it is worth calling ahead.',
    tags: ['certified-techs', 'flat-club', 'trade-in', 'surly', 'carrboro'],
    contact_email: null,
    contact_phone: '(919) 967-5104',
    location: 'Carrboro, NC',
    website: 'https://thecleanmachine.com/',
  },
  {
    title: 'Back Alley Bikes',
    summary: 'Service-focused downtown Carrboro shop taking walk-ins on all makes and models',
    details:
      'Back Alley Bikes on Boyd Street in downtown Carrboro was founded specifically around service, aiming to be the area\u2019s friendliest and highest quality full-service shop for all makes, models, and types of bicycles. Work ranges from suspension servicing for trail riders through simple gear adjustments for students to custom wheel builds for serious cyclists. Walk-ins are welcome, which is useful for quick fixes without booking ahead. The shop also runs group rides, clinics, and community events, and stocks bikes for sale.',
    tags: ['walk-ins', 'all-brands', 'full-service', 'group-rides', 'carrboro'],
    contact_email: null,
    contact_phone: '(919) 967-7777',
    location: 'Carrboro, NC',
    website: 'https://www.backalleybikes.net/',
  },
  {
    title: 'Trek Bicycle Chapel Hill',
    summary: 'Brand store on South Elliott Road offering sales and service',
    details:
      'Trek Bicycle Chapel Hill on South Elliott Road is a Trek brand store handling both sales and service. As a manufacturer-operated location it is the natural stop for warranty work and parts on Trek bikes specifically, alongside general repair and tune-ups. It sits in the Elliott Road area convenient to central Chapel Hill.',
    tags: ['trek', 'brand-store', 'sales-and-service', 'warranty-work', 'chapel-hill'],
    contact_email: null,
    contact_phone: '(919) 589-1609',
    location: 'Chapel Hill, NC',
    website: 'https://www.trekbikes.com/us/en_US/retail/chapel_hill/',
  },
  {
    title: 'Pittsboro eBikes',
    summary: 'Electric bike rentals, sales, and service at The Plant in Pittsboro, the closest shop to Briar Chapel',
    details:
      'Pittsboro eBikes operates out of The Plant on Lorax Lane in Pittsboro, a 17-acre business community that also houses several breweries, a distillery, and a coffee roaster. It is the closest bike shop to Briar Chapel. The business covers electric bike rentals, sales, and service, with online booking and same-day pickup for rentals. Published rental rates run $10 per day for an eScooter and $18 per day for an eBike in either 36V or 48V. Note this shop is oriented more toward e-bike rental and sales than general bicycle repair, so call ahead if you need service on a conventional bike.',
    tags: ['e-bikes', 'rentals', 'pittsboro', 'the-plant', 'closest-to-briar-chapel'],
    contact_email: null,
    contact_phone: '(919) 533-9766',
    location: 'Pittsboro, NC',
    website: 'https://pittsboroebikes.com/',
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
