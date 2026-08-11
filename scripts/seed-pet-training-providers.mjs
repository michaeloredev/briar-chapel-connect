/**
 * One-off seed for pet training providers in the Chapel Hill / Briar Chapel area.
 *
 * Only registered businesses are listed here. Individuals advertising on gig
 * platforms or neighborhood apps are deliberately excluded.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-pet-training-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'pet-services/pet-training';

const PROVIDERS = [
  {
    title: 'Hearth and Hounds',
    summary: 'Chapel Hill trainers offering force-free private lessons and Canine Good Citizen prep',
    details:
      'Hearth and Hounds is a Chapel Hill dog training business led by two certified professional trainers, Susan Spinks and Melanie Berk. Both hold the CPDT-KA credential and use only positive, force-free, reward-based methods. Susan completed Levels 1 and 2 of the Pat Miller Canine Behavior and Training Academy, is an AKC Canine Good Citizen Evaluator, and managed the dog training program at Paws4ever from 2020 to 2022. Melanie holds a Master\u2019s in Animals and Public Policy from Tufts, is a Certified Canine Enrichment Technician, and has over 12 years of experience with shy and anxious dogs. They offer private in-home and public-space sessions, group classes at client locations, and structured Canine Good Citizen preparation, and specialize in puppies, fearful dogs, reactivity, and leash pulling.',
    tags: ['cpdt-ka', 'force-free', 'private-lessons', 'canine-good-citizen', 'reactivity'],
    contact_email: null,
    contact_phone: '(919) 355-5656',
    location: 'Chapel Hill, NC',
    website: 'https://www.hearthandhounds.com/',
  },
  {
    title: 'Pet Behavior Help',
    summary: 'Training center offering group obedience classes and private behavior work with certified staff',
    details:
      'Pet Behavior Help offers private dog training lessons and group classes from a location on Wendell Road, serving Chapel Hill, Durham, and Raleigh. Owner Val is a certified canine behavior specialist who takes private cases involving anxiety, reactivity, and aggression, working alongside a team of additional instructors. Group obedience classes focus on positive training techniques in a structured setting, and the center also runs rally and agility instruction. All ages, breeds, and skill levels are accepted.',
    tags: ['obedience', 'group-classes', 'behavior', 'reactivity', 'agility'],
    contact_email: 'val@petbehaviorhelp.com',
    contact_phone: '(919) 270-2010',
    location: 'Chapel Hill, NC',
    website: 'https://petbehaviorhelp.com/',
  },
  {
    title: 'Whole Dog Institute',
    summary: 'Small-group obedience, nose work, and agility classes serving the Chapel Hill area',
    details:
      'Whole Dog Institute serves the Durham, Chapel Hill, and Hillsborough area from a training facility on US Highway 70 Business. Founders Liz Turpin and Beth Grooms are both Certified Professional Dog Trainers Knowledge Assessed and Pat Miller Certified Trainers. Group classes are kept small at five to six dogs and cover puppy, teen, and adult obedience, reactive dog behavior modification, K9 Nose Work, agility, and therapy dog preparation. Private lessons are available in-home or at the facility, and the institute also runs a board and train program, rents training rings, and hosts drop-in puppy playtime for unvaccinated pups. The outdoor space includes agility fields.',
    tags: ['cpdt-ka', 'small-classes', 'nose-work', 'agility', 'board-and-train'],
    contact_email: 'info@wholedoginstitute.com',
    contact_phone: '(919) 452-3764',
    location: 'Durham & Chapel Hill, NC',
    website: 'https://wholedoginstitute.com/',
  },
  {
    title: 'Green Beagle Lodge Training',
    summary: 'Obedience training run out of the Chapel Hill and Pittsboro pet lodges',
    details:
      'Green Beagle Lodge offers dog training alongside its boarding, daycare, and grooming services at both its Chapel Hill facility on Millhouse Road and its Pittsboro facility on Lodge Lane. Working with the lodge trainers, owners learn both how to achieve obedience and how to better read and understand their dog. Because training runs out of facilities the dogs may already visit for daycare or boarding, it can be combined with a regular stay. The Pittsboro location is roughly 18 minutes from Briar Chapel and the Chapel Hill location sits within 27516.',
    tags: ['obedience', 'facility-based', 'daycare-combo', 'local', 'two-locations'],
    contact_email: 'chapelhill@greenbeaglelodge.com',
    contact_phone: '(919) 929-7387',
    location: 'Chapel Hill & Pittsboro, NC',
    website: 'https://greenbeaglelodge.com/chapelhill/training/',
  },
  {
    title: 'Carolina Dog Training',
    summary: 'Private one-on-one and residency board-and-train programs covering the Chapel Hill area',
    details:
      'Carolina Dog Training is led by Elaine Hope Poulin, a certified professional dog trainer, and serves the Raleigh, Durham, Cary, and Chapel Hill triangle from a base in Cary. The business focuses on private one-on-one instruction and residency board-and-train programs rather than group classes, and also covers family puppy orientation and therapy dog training. A related service, The Pack Sitters, offers dog walking and sitting with integrated training reinforcement for graduates of its programs. Because the business is based in Cary, Chapel Hill sits at the western edge of its service area, so confirming travel and availability is worthwhile.',
    tags: ['private-training', 'board-and-train', 'puppy', 'therapy-dog', 'in-home'],
    contact_email: 'elaine@carolinadogtraining.com',
    contact_phone: '(919) 349-0000',
    location: 'Chapel Hill & Triangle, NC',
    website: 'https://carolinadogtraining.com/dog-training-chapel-hill-north-carolina/',
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
