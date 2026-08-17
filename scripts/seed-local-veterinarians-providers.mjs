/**
 * One-off seed for veterinary providers in the Chapel Hill / Briar Chapel area.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-local-veterinarians-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'pet-services/local-veterinarians';

const PROVIDERS = [
  {
    title: 'Cole Park Veterinary Hospital',
    summary: 'Full-service small animal hospital on Woodbridge Drive, inside the 27516 ZIP code',
    details:
      'Cole Park Veterinary Hospital is a full-service veterinary medical facility on Woodbridge Drive in Chapel Hill, one of the few practices with a 27516 address. The practice provides medical, surgical, and dental care for dogs and cats, with an emphasis on preventative health care and client education. For emergencies outside business hours the hospital refers clients to BluePearl in Cary or Triangle Veterinary Referral Hospital in Durham, and to UrgentVet in Chapel Hill for non-life-threatening issues.',
    tags: ['small-animal', 'surgery', 'dental', 'preventative', '27516'],
    contact_email: null,
    contact_phone: '(919) 929-3352',
    location: 'Chapel Hill, NC',
    website: 'https://coleparkvet.com/',
  },
  {
    title: 'Meadowmont Animal Hospital',
    summary: 'Independent Chapel Hill practice on Finley Golf Course Road with same-day sick visits',
    details:
      'Meadowmont Animal Hospital is an independently owned practice on Finley Golf Course Road that has served Chapel Hill for over a decade. Services include wellness care, same-day sick visits, veterinary dentistry, surgery, urgent care, daytime hospitalization, and referral to specialists for after-hours needs. The practice treats dogs and cats and serves Chapel Hill, Carrboro, Hillsborough, Durham, and the greater Orange and Chatham county area. It has been recognized with local Best Veterinarian and Best of Chapel Hill awards.',
    tags: ['independent', 'same-day', 'dentistry', 'surgery', 'urgent-care'],
    contact_email: 'welovepets@meadowmontah.com',
    contact_phone: '(919) 951-7851',
    location: 'Chapel Hill, NC',
    website: 'https://meadowmontah.com/',
  },
  {
    title: 'Vine Veterinary Hospital & Surgical Center',
    summary: 'Independently owned Carrboro–Chapel Hill hospital offering same-day appointments and walk-ins',
    details:
      'Vine Veterinary Hospital & Surgical Center is an independently owned animal hospital serving the Carrboro and Chapel Hill community. It offers a full range of preventive and advanced veterinary care alongside an on-site surgical center. The practice accepts same-day appointments and welcomes walk-ins during regular business hours, and asks that clients call ahead for urgent cases so the team can prepare for arrival. Appointments can be requested by phone, text, or through an online form.',
    tags: ['independent', 'surgery', 'walk-ins', 'same-day', 'preventive'],
    contact_email: null,
    contact_phone: '(919) 942-5117',
    location: 'Chapel Hill, NC',
    website: 'https://vineveterinaryhospital.com/',
  },
  {
    title: 'Kindred Heart Animal Hospital',
    summary: 'Two-location practice with clinics in Carrboro and at Governors Village in Chapel Hill',
    details:
      'Kindred Heart Animal Hospital operates two clinics, one on Two Hills Drive in Carrboro and one at Governors Village on Governors Drive in Chapel Hill. Services span routine wellness exams and vaccinations through advanced diagnostics, dermatology, dental care, senior pet care, and surgical procedures. The Chapel Hill location is the more convenient of the two for residents south of town. Each clinic maintains its own direct phone line; the Chapel Hill office can be reached at (919) 756-7680.',
    tags: ['two-locations', 'wellness', 'dermatology', 'dental', 'senior-care'],
    contact_email: null,
    contact_phone: '(919) 525-1962',
    location: 'Carrboro & Chapel Hill, NC',
    website: 'https://kindredheartvet.com/',
  },
  {
    title: 'UrgentVet Chapel Hill',
    summary: 'After-hours and weekend urgent care for dogs and cats, with walk-ins and online check-in',
    details:
      'UrgentVet Chapel Hill provides after-hours and weekend urgent care for sick or injured dogs and cats from a location on Fordham Boulevard. It fills the gap between a regular veterinary practice and a full emergency hospital, handling non-life-threatening issues that cannot wait for a routine appointment. Clients can walk in or reserve a spot online ahead of arrival. Several area practices, including Cole Park Veterinary Hospital, refer clients here for non-emergency after-hours needs, while true emergencies are directed to BluePearl in Cary or Triangle Veterinary Referral Hospital in Durham.',
    tags: ['urgent-care', 'after-hours', 'weekend', 'walk-in', 'dogs-cats'],
    contact_email: null,
    contact_phone: '(984) 261-2323',
    location: 'Chapel Hill, NC',
    website: 'https://www.urgentvet.com/chapel-hill/',
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
