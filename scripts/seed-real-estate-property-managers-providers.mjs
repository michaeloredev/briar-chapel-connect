/**
 * One-off seed for real estate and property management providers serving Briar Chapel.
 *
 * Real estate is inherently an individual-agent business, so named brokers are
 * included where they operate under an established brokerage.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-real-estate-property-managers-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'professional-miscellaneous/real-estate-property-managers';

const PROVIDERS = [
  {
    title: 'Team Winkler - Briar Chapel Specialists',
    summary: 'Briar Chapel residents and EcoBrokers who have sold over 350 homes in the community',
    details:
      'Jennifer and Peter Winkler are licensed brokers who live in Briar Chapel and have sold over 350 homes within the community, making them the most established specialists in the neighborhood. Jen has been one of the top-selling brokers in Briar Chapel, was voted Chapel Hill\u2019s Favorite Realtor by Chapel Hill Magazine readers in 2017 and 2018, and was named Briar Chapel\u2019s Neighborhood Favorite agent by Nextdoor. She is a Certified EcoBroker with specialized training in the green-certified home construction required throughout Briar Chapel, and owns a green-certified home there with a 5kW solar PV system. The team maintains a dedicated Briar Chapel site covering amenities, the community map, and available homes, and refers clients to a preferred lender and closing attorney.',
    tags: ['briar-chapel', 'ecobroker', 'green-homes', 'buyers-and-sellers', 'neighborhood-specialist'],
    contact_email: 'jen@teamwinkler.com',
    contact_phone: '(919) 593-3662',
    location: 'Briar Chapel, Chapel Hill, NC',
    website: 'https://www.briarchapelhomes.com/',
  },
  {
    title: 'Chatham Homes Realty',
    summary: 'The largest real estate firm in Chatham County, operating from Pittsboro since 2005',
    details:
      'Chatham Homes Realty was founded in 2005 by owner-broker Kris Howard and has grown into the largest real estate firm in Chatham County, with its main office on West Street in Pittsboro plus locations in Siler City and Apex. The team covers residential, land, and EcoBroker specialties, working with buyers, sellers, and investors. With more than a dozen agents based in the Pittsboro office alone, it offers depth of local coverage that smaller firms cannot match. The firm also handles property management alongside brokerage.',
    tags: ['pittsboro', 'largest-in-county', 'land-sales', 'ecobroker', 'property-management'],
    contact_email: null,
    contact_phone: '(919) 545-2333',
    location: 'Pittsboro, NC',
    website: 'https://www.chathamhomesrealty.com/',
  },
  {
    title: 'Eric Andrews Realtor',
    summary: 'Accredited Land Consultant and property management broker on Hillsboro Street in Pittsboro',
    details:
      'Eric Andrews is an Accredited Land Consultant based on Hillsboro Street in Pittsboro and is the only Realtor in Pittsboro to hold the ALC accreditation, held by fewer than 500 Realtors nationwide. He specializes in land sales across the Piedmont region including Chatham and Orange counties. He was named a TCAR Elite Broker for both Land Sales and Property Management in 2023 and is a member of the North Carolina Association of Realtors Property Management Division, so he handles rental and investment property management alongside sales. He also serves on the Chatham County Planning Board, the UDO Chatham County sub-committee, and the Pittsboro Downtown Advisory Board, and is a licensed auctioneer.',
    tags: ['land-sales', 'property-management', 'accredited-land-consultant', 'pittsboro', 'auctioneer'],
    contact_email: null,
    contact_phone: '(919) 548-1014',
    location: 'Pittsboro, NC',
    website: 'https://www.ericandrewsrealtor.com/',
  },
  {
    title: 'Weaver Street Realty',
    summary: 'Chapel Hill and Carrboro brokerage offering property management alongside sales',
    details:
      'Weaver Street Realty is an established Chapel Hill and Carrboro area brokerage that handles property management in addition to residential sales. It is a long-standing local name in the Carrboro real estate market. Contact the office directly to confirm current property management availability and terms, as rental inventory in the area moves quickly.',
    tags: ['property-management', 'carrboro', 'chapel-hill', 'residential-sales', 'local'],
    contact_email: null,
    contact_phone: '(919) 929-2020',
    location: 'Carrboro, NC',
    website: 'https://www.weaverstreetrealty.com/',
  },
  {
    title: 'Red Door Company',
    summary: 'Triangle property management and brokerage handling rentals across Chapel Hill and Chatham County',
    details:
      'Red Door Company is a Triangle-based property management and real estate brokerage that lists and manages properties across Chapel Hill and the surrounding Chatham County area, including listings inside the 27516 and 27517 ZIP codes. The firm works with both owners looking to place a rental and buyers or sellers in the wider Triangle market. Its office is in Durham, so it is a regional operator rather than a Chatham County local, but it actively serves the Briar Chapel area.',
    tags: ['property-management', 'rentals', 'triangle-wide', 'brokerage', 'investors'],
    contact_email: null,
    contact_phone: '(919) 321-0128',
    location: 'Durham, NC',
    website: 'https://reddoorcompany.com/',
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
