/**
 * One-off seed for elder care and senior assistance providers in the Chapel Hill / Briar Chapel area.
 *
 * Only licensed agencies are listed here. Independent caregivers advertising on
 * gig platforms are deliberately excluded.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-elder-care-senior-assistance-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'community-personal-services/elder-care-senior-assistance';

const PROVIDERS = [
  {
    title: 'Senior Helpers of Chapel Hill',
    summary: 'Licensed in-home senior care based in Chatham Park, Pittsboro, minutes from Briar Chapel',
    details:
      'Senior Helpers of Chapel Hill operates from Russet Run in Chatham Park, Pittsboro, making it the closest licensed home care agency to Briar Chapel. Services range from companion care for seniors who need daily support through specialized care for Alzheimer\u2019s, dementia, Parkinson\u2019s, and other chronic illnesses. The agency is owned and operated by Todd and Ben Rogers, and its caregivers and staff live in the greater Pittsboro area. It holds North Carolina home care license #HC8347 and is reachable around the clock. Service area covers Durham, Chapel Hill, Carrboro, Pittsboro, and Sanford.',
    tags: ['licensed', 'pittsboro', 'dementia-care', 'companion-care', '24-hour'],
    contact_email: 'clients_3741@seniorhelpers.com',
    contact_phone: '(919) 503-5805',
    location: 'Pittsboro, NC',
    website: 'https://www.seniorhelpers.com/nc/chapel-hill/',
  },
  {
    title: 'Home Instead Chapel Hill',
    summary: 'Non-medical in-home care serving Chapel Hill since 1997 across Orange, Chatham, and Durham counties',
    details:
      'Home Instead has served Chapel Hill since 1997 and has provided more than 850,000 hours of in-home care to local families. Care Pros deliver non-medical support ranging from meal preparation and companionship through memory-loss support and transportation to UNC Health appointments. Most clients begin receiving care within 48 hours of contact, and many stay with the agency for two and a half years or longer. Coverage extends across Orange, Chatham, and Durham counties, including Chapel Hill, Carrboro, Pittsboro, Hillsborough, Mebane, Efland, and Cedar Grove. Free consultations are available before a care plan is built.',
    tags: ['established', 'non-medical', 'memory-care', 'companionship', 'transportation'],
    contact_email: null,
    contact_phone: '(919) 933-3300',
    location: 'Chapel Hill, NC',
    website: 'https://www.homeinstead.com/home-care/usa/nc/chapel-hill/106/',
  },
  {
    title: 'Visiting Angels of Chapel Hill',
    summary: 'One-on-one home care from a Carrboro office serving Orange, Durham, Chatham, and Alamance counties',
    details:
      'Visiting Angels of Chapel Hill works out of an office on Jones Ferry Road in Carrboro and provides customizable, one-on-one in-home care plans for seniors. The agency covers Orange, Durham, Chatham, and Alamance counties. Care plans are built around each client rather than fitted to a fixed package, and caregivers are screened before placement. Families can call to discuss options before committing to a schedule.',
    tags: ['one-on-one', 'carrboro', 'custom-care-plans', 'chatham-county', 'in-home'],
    contact_email: null,
    contact_phone: '(919) 321-2136',
    location: 'Carrboro, NC',
    website: 'https://www.visitingangels.com/chapelhill/home',
  },
  {
    title: 'Homewatch CareGivers of Chapel Hill',
    summary: 'In-home care with dementia and injury-recovery specialization, from respite to 24-hour support',
    details:
      'Homewatch CareGivers of Chapel Hill provides in-home care spanning part-time respite through around-the-clock coverage. Services include elder care, dementia care, chronic conditions care, transitional care after a hospital stay, personal care, and transportation. Caregivers receive condition-specific training for dementia, Alzheimer\u2019s, Parkinson\u2019s, and other chronic illnesses. All caregivers are trained, background-checked, and insured, and the location is licensed per state and local requirements.',
    tags: ['dementia-care', 'respite-care', '24-hour', 'transitional-care', 'insured'],
    contact_email: null,
    contact_phone: '(919) 289-3270',
    location: 'Chapel Hill, NC',
    website: 'https://www.homewatchcaregivers.com/chapel-hill/',
  },
  {
    title: 'Always Best Care of Chapel Hill & Durham',
    summary: 'Non-medical senior care with CNAs on staff, offering hourly, overnight, and live-in schedules',
    details:
      'Always Best Care of Chapel Hill & Durham operates from Legion Road and specializes in non-medical care for seniors who want to remain in their own homes. The agency maintains a large team of Certified Nursing Assistants and trained caregivers, and staffing coordinators arrange hourly, overnight, or live-in schedules. Each client receives an individualized care plan to keep service consistent. All caregivers are bonded, insured, background checked, and drug tested. The agency also offers an assisted living placement service for families weighing senior housing options.',
    tags: ['cna-staff', 'live-in-care', 'overnight', 'bonded-insured', 'placement-service'],
    contact_email: null,
    contact_phone: '(336) 270-4352',
    location: 'Chapel Hill, NC',
    website: 'https://alwaysbestcare.com/chapel-hill/',
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
