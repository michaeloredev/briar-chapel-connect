/**
 * One-off seed for dog walking and pet sitting providers in the Chapel Hill / Briar Chapel area.
 *
 * Only registered businesses are listed here. Individuals advertising on gig
 * platforms or neighborhood apps are deliberately excluded.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-dog-walking-pet-sitting-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'pet-services/dog-walking-pet-sitting';

const PROVIDERS = [
  {
    title: 'Cats@Home',
    summary: 'In-home cat care based in North Chatham, with Briar Chapel named in its service area',
    details:
      'Cats@Home is a North Chatham business specializing exclusively in in-home care for cats, operating since 2000 under owner Kristin White del Rosso. She is a certified pet sitter with both Pet Sitters International and the National Association of Professional Pet Sitters. The published service area names Briar Chapel directly, along with Chatham Forest, Fearrington, Governors Club, Lystra Preserve, Potters Ridge, Powell Place, Southern Village, and Westfall. Because coverage varies by address, the business asks prospective clients to confirm their location before booking.',
    tags: ['cat-care', 'in-home', 'briar-chapel', 'certified', 'established'],
    contact_email: null,
    contact_phone: null,
    location: 'North Chatham & Briar Chapel, NC',
    website: 'https://catsathomenc.com/',
  },
  {
    title: 'Walk & Wag',
    summary: 'Chapel Hill and Carrboro dog walking and pet sitting company operating since 2010',
    details:
      'Walk & Wag has cared for pets in the Chapel Hill and Carrboro area since 2010 under owner Lisa Kang, who hand-picks the team of professional walkers and sitters. The company is licensed, bonded, and insured through Business Insurers of the Carolinas and is recommended by local veterinarians. Services include one-on-one dog walks, cat visits, care for other animals such as chickens or fish, vacation visits, overnight stays, a pet taxi to vet and groomer appointments, and a pet concierge service for picking up supplies. Clients receive a daily report with walk lengths, locations, feedings, photos, and short videos through the Time To Pet portal. A surcharge may apply for outlying locations.',
    tags: ['dog-walking', 'pet-sitting', 'bonded', 'insured', 'pet-taxi'],
    contact_email: 'lisa@walkandwagchapelhill.com',
    contact_phone: '(919) 619-4456',
    location: 'Chapel Hill & Carrboro, NC',
    website: 'https://walkandwagchapelhill.com/',
  },
  {
    title: "Kate's Critter Care",
    summary: 'Veterinarian-recommended dog walking and in-home pet sitting, established 2008',
    details:
      "Kate's Critter Care has provided dog walking and in-home pet sitting in Carrboro, Chapel Hill, and South Durham since 2008, owned and operated by Kate Turlington. The company is licensed and insured, veterinarian recommended, and certified in American Red Cross Pet First Aid and CPR. Services are fully customizable and range from a single mid-day walk to 24-hour live-in care, and include fresh food and water, potty breaks, playtime, medication administration, litter box and crate maintenance, and cleanup of pet-related accidents. New clients start with a short questionnaire about their animals and reservation needs.",
    tags: ['dog-walking', 'pet-sitting', 'insured', 'pet-first-aid', 'overnight'],
    contact_email: null,
    contact_phone: '(919) 943-8083',
    location: 'Carrboro & Chapel Hill, NC',
    website: 'https://katescrittercare.com/',
  },
  {
    title: "Kaitlyn's Kuddles Pet Services",
    summary: 'Insured and bonded in-home pet sitting and dog walking across Chapel Hill and Carrboro',
    details:
      "Kaitlyn's Kuddles Pet Services provides in-home pet sitting, dog sitting, and dog walking throughout Chapel Hill, Carrboro, Durham, and Morrisville. Sitters are trained and background checked, and the business is fully insured and bonded. Visits are built around each pet's existing routine and include feeding, playtime, litter and waste cleanup, and photo updates after each visit. Dog walks cover leash walks and potty breaks with activity updates. Rates are set by visit duration and care needs, and the company also offers house care while clients are away.",
    tags: ['pet-sitting', 'dog-walking', 'insured', 'bonded', 'background-checked'],
    contact_email: null,
    contact_phone: '(919) 804-8944',
    location: 'Chapel Hill & Carrboro, NC',
    website: 'https://www.kaitlynskuddles.com/',
  },
  {
    title: 'Nose, Toes & Tails Pet Care',
    summary: 'Locally owned pet sitting, dog walking, and pet transport serving Chapel Hill since 2018',
    details:
      'Nose, Toes & Tails Pet Care is a locally owned business created in 2018 and based in Haw River, serving Chapel Hill, Carrboro, Durham, and Hillsborough along with Mebane, Burlington, and Graham. Services cover pet sitting, dog walking, and pet transport. Because the company is based further north than most options on this list, Chapel Hill sits toward the southern edge of its coverage, so confirming availability for a specific address is worthwhile.',
    tags: ['pet-sitting', 'dog-walking', 'pet-transport', 'local', 'orange-county'],
    contact_email: null,
    contact_phone: '(919) 418-3899',
    location: 'Chapel Hill & Hillsborough, NC',
    website: 'https://www.nosetoestails.com/',
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
