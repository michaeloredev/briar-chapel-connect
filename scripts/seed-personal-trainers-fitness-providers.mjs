/**
 * One-off seed for personal training and fitness providers in the Chapel Hill / Briar Chapel area.
 *
 * Only studios and clubs with a physical location are listed here. Independent
 * trainers advertising on gig platforms are deliberately excluded.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-personal-trainers-fitness-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'community-personal-services/personal-trainers-fitness';

const PROVIDERS = [
  {
    title: 'O2 Fitness Briar Chapel',
    summary: 'Full-service Signature club on Market Chapel Road with personal training, classes, and childcare',
    details:
      'O2 Fitness Briar Chapel is a full-service Signature Club on Market Chapel Road just off Highway 15-501, serving members from Chapel Hill, Carrboro, Pittsboro, and northern Chatham County. The facility includes a cardio deck overlooking the strength-training area, a quieter cardio theater, and an indoor turf area for functional training. Membership covers unlimited group fitness classes, access to all O2 Fitness locations, and two complimentary personal training sessions. Additional amenities include a Kids Club for childcare during workouts, a coworking space, physiotherapy, and nutrition counseling. Hours are Monday through Thursday 5am to 10pm, Friday 5am to 9pm, and weekends 7am to 7pm. Daily, weekly, and monthly guest passes are available.',
    tags: ['briar-chapel', 'full-service-gym', 'group-fitness', 'personal-training', 'childcare'],
    contact_email: null,
    contact_phone: '(919) 942-6002',
    location: 'Briar Chapel, Pittsboro, NC',
    website: 'https://o2fitnessclubs.com/',
  },
  {
    title: 'FIT Carrboro',
    summary: 'Personal training, group training, and Pilates studio on East Main Street in Carrboro',
    details:
      'FIT Carrboro is a personal training and Pilates studio on East Main Street in downtown Carrboro. The studio offers one-on-one personalized training, group training, virtual training, and Pilates reformer classes, along with community events for members. Its trainers bring more than 180 years of combined experience and work from a stated client-first, do-no-harm approach, building individualized programming around each person rather than a fixed template. Programs are designed to be appropriate to the individual regardless of starting fitness level.',
    tags: ['personal-training', 'pilates', 'group-training', 'carrboro', 'virtual-training'],
    contact_email: null,
    contact_phone: '(919) 590-0892',
    location: 'Carrboro, NC',
    website: 'https://www.fitcarrboro.com/',
  },
  {
    title: 'Fitness Together Chapel Hill',
    summary: 'Private one-on-one personal training in individual workout suites at Meadowmont Village',
    details:
      'Fitness Together Chapel Hill is a personal training studio in Meadowmont Village Circle built around private workout suites rather than an open gym floor. Every session is one-on-one with a trainer, either in-studio or virtually. New clients start with a complimentary fit evaluation so the trainer can understand their goals and starting point before building a custom program. The private-suite format suits people who prefer not to train in a crowded gym environment, and programs are designed to work at any age or fitness level.',
    tags: ['one-on-one', 'private-suites', 'meadowmont', 'custom-programs', 'virtual-training'],
    contact_email: null,
    contact_phone: '(919) 932-7303',
    location: 'Chapel Hill, NC',
    website: 'https://www.fitnesstogether.com/chapelhill',
  },
  {
    title: 'F45 Training East Chapel Hill',
    summary: 'Team-based functional interval training studio on Fordham Boulevard',
    details:
      'F45 Training East Chapel Hill runs the F45 team training format from a studio on Fordham Boulevard. Workouts are 45-minute functional circuits combining resistance and cardiovascular work, led by coaches in a group setting with rotating daily programming so sessions do not repeat. The team-based structure suits people who prefer accountability and a set class time over designing their own workouts. A seven-day trial is available for new members.',
    tags: ['group-training', 'hiit', 'functional-fitness', '45-minute', 'trial-available'],
    contact_email: null,
    contact_phone: '(919) 895-3851',
    location: 'Chapel Hill, NC',
    website: 'https://f45training.com/studio/eastchapelnc',
  },
  {
    title: 'FlowCorps',
    summary: 'Movement and fitness studio on South Elliott Road in Chapel Hill',
    details:
      'FlowCorps operates a movement and fitness studio on South Elliott Road in Chapel Hill. The studio focuses on coached movement and strength work rather than open-gym access, working with clients across a range of experience levels. Pricing and current class offerings are shared by phone, so calling ahead is the best way to find out what fits your schedule and goals.',
    tags: ['movement', 'strength', 'coached', 'chapel-hill', 'small-studio'],
    contact_email: null,
    contact_phone: '(919) 525-3989',
    location: 'Chapel Hill, NC',
    website: 'https://flowcorps.com/',
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
