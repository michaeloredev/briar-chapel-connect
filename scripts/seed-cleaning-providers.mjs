/**
 * One-off seed for cleaning service providers in the Chapel Hill / Briar Chapel area.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-cleaning-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'home-property-services/cleaning-services';

const PROVIDERS = [
  {
    title: 'Molly Maid of Chapel Hill',
    summary: 'Locally owned, bonded and insured maid service serving Chapel Hill since 1997',
    details:
      'Molly Maid of Chapel Hill is a locally owned and independently operated franchise that has served Orange, Durham, and Chatham counties since 1997. Services include one-time and recurring house cleaning (weekly, biweekly, or monthly), apartment and condo cleaning, move-in/move-out cleans, and light commercial work. Bonded and insured, with no long-term contracts required.',
    tags: ['insured', 'bonded', 'recurring', 'move-out', 'franchise'],
    contact_email: null,
    contact_phone: '(919) 328-2286',
    location: 'Chapel Hill, NC',
    website: 'https://www.mollymaid.com/locations/chapel-hill/',
  },
  {
    title: 'The Cleaning Authority - Chapel Hill',
    summary: 'Family-owned maid service with a detail-rotation cleaning system and eco-friendly products',
    details:
      'Family owned and operated, The Cleaning Authority - Chapel Hill serves Chapel Hill, Carrboro, Pittsboro, Hillsborough, and Durham. They use a rotating "Detail-Clean" system so different areas of the home get deep attention on each visit, and they clean with environmentally responsible products. Free in-home estimates are available.',
    tags: ['family-owned', 'eco-friendly', 'recurring', 'free-estimate'],
    contact_email: null,
    contact_phone: '(919) 648-0523',
    location: 'Chapel Hill & Pittsboro, NC',
    website: 'https://www.thecleaningauthority.com/chapelhill/',
  },
  {
    title: 'Enovana Green Cleaning',
    summary: 'Eco-friendly house cleaning with upfront online pricing, serving Briar Chapel since 2007',
    details:
      'Enovana Green Cleaning has provided green residential cleaning across the Triangle since 2007 and lists Briar Chapel among the neighborhoods it serves. Offerings include recurring weekly, biweekly, and monthly service, one-time deep cleans, move-in/move-out cleaning, and custom requests such as extra attention to baseboards or bathrooms. Booking is done online with upfront pricing and same-day scheduling of your preferred time slot.',
    tags: ['eco-friendly', 'green', 'online-booking', 'recurring', 'deep-clean'],
    contact_email: 'raleigh@enovanagreencleaning.com',
    contact_phone: '(919) 801-8588',
    location: 'Chapel Hill & Briar Chapel, NC',
    website: 'https://enovanagreencleaning.com/chapel-hill-cleaning-services/',
  },
  {
    title: 'MaidPro Chapel Hill',
    summary: 'Customizable maid service built on a 49-point checklist, serving Briar Chapel and nearby neighborhoods',
    details:
      'MaidPro Chapel Hill cleans single-family homes, townhouses, condos, and apartments, and specifically names Briar Chapel, Meadowmont, Winmore, Governors Club, and Sunset Creek among its service areas. Every clean follows a 49-Point Checklist that can be customized with special instructions for any visit. Weekly, biweekly, monthly, and one-time cleanings are available with no long-term contract.',
    tags: ['checklist', 'customizable', 'recurring', 'one-time', 'no-contract'],
    contact_email: null,
    contact_phone: '(919) 942-9339',
    location: 'Chapel Hill, NC',
    website: 'https://www.maidpro.com/chapelhill',
  },
  {
    title: 'Sylvia Cleaning of Chapel Hill',
    summary: 'Small locally owned maid service run by a longtime Carrboro resident, serving Briar Chapel',
    details:
      'Sylvia Cleaning is a locally owned and operated maid service that has worked in Chapel Hill, Carrboro, Durham, and surrounding Orange County communities since 2010, and lists Briar Chapel among the neighborhoods it covers. Services include recurring weekly, biweekly, and monthly cleaning, one-time deep cleaning, move-in/move-out turnovers, and office and apartment cleaning, with eco-friendly products available on request. Quotes are provided upfront with no hidden fees.',
    tags: ['local', 'small-business', 'eco-friendly-option', 'deep-clean', 'move-out'],
    contact_email: 'SilviaCleaningserv@gmail.com',
    contact_phone: '(919) 265-8859',
    location: 'Chapel Hill & Carrboro, NC',
    website: 'https://www.sylvianc.com/',
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
