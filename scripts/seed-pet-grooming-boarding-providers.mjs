/**
 * One-off seed for pet grooming and boarding providers in the Chapel Hill / Briar Chapel area.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-pet-grooming-boarding-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'pet-services/pet-grooming-boarding';

const PROVIDERS = [
  {
    title: 'Green Beagle Lodge - Chapel Hill',
    summary: 'Award-winning all-inclusive pet lodge on Millhouse Road offering boarding, daycare, and grooming',
    details:
      'Green Beagle Lodge opened in Chapel Hill in 2014 and offers boarding, daycare, grooming and bathing, and training from its Millhouse Road facility inside 27516. Lodging is all-inclusive with no added fees for feeding, playtime, or medication administration, and includes twice-daily health checks and supervised outdoor play. Dogs are grouped for play by temperament, size, and activity level, and every new dog completes a half-day on-site assessment before their first boarding or daycare stay. The lodge won the Chamber of Commerce inaugural New Business of the Year award and has taken awards from Chapelboro, The Independent, and the Chamber in the years since.',
    tags: ['boarding', 'daycare', 'grooming', 'all-inclusive', 'local'],
    contact_email: 'chapelhill@greenbeaglelodge.com',
    contact_phone: '(919) 929-7387',
    location: 'Chapel Hill, NC',
    website: 'https://greenbeaglelodge.com/chapelhill/',
  },
  {
    title: 'Green Beagle Lodge - Pittsboro',
    summary: 'Sister facility on a 13-acre Chatham County tract, roughly 18 minutes from Briar Chapel',
    details:
      'The Pittsboro location of Green Beagle Lodge opened in December 2022 and is the closest of the two facilities to Briar Chapel, at roughly 18 minutes away. It occupies an 11,000 square foot building on a 13-acre tract on the eastern edge of Chatham Park, just above Route 64. Services match the Chapel Hill lodge: all-inclusive boarding, daycare, grooming and bathing, and training, with an emphasis on active social play in outdoor yards. Staff receive extensive training in reading canine body language and managing off-leash play groups, and the lodge accommodates dogs with dietary restrictions or limited exercise requirements.',
    tags: ['boarding', 'daycare', 'grooming', 'chatham-county', 'training'],
    contact_email: 'pittsboro@greenbeaglelodge.com',
    contact_phone: '(919) 929-7387',
    location: 'Pittsboro, NC',
    website: 'https://greenbeaglelodge.com/pittsboro/',
  },
  {
    title: 'Woof Gang Bakery & Grooming Chapel Hill',
    summary: 'Women-owned full-service grooming salon and pet store on Environ Way',
    details:
      'Woof Gang Bakery & Grooming Chapel Hill is a full-service grooming salon and neighborhood pet store on Environ Way. Grooming covers all breeds and sizes and includes bathing, haircuts, nail trimming, ear cleaning, sanitary trims, and specialized treatments such as de-shedding. The store also carries all-natural chews, treats, pet food, toys, and accessories. The business identifies as women-owned and holds a 4.8 star average across roughly 296 reviews. Appointments are strongly recommended over walk-ins.',
    tags: ['grooming', 'women-owned', 'pet-store', 'all-breeds', 'appointment'],
    contact_email: null,
    contact_phone: '(919) 869-7265',
    location: 'Chapel Hill, NC',
    website: 'https://woofgangbakery.com/pages/locations/chapel-hill',
  },
  {
    title: 'Dogwood Veterinary Hospital & Pet Resort',
    summary: 'Veterinary-supervised boarding, daycare, and grooming attached to a full-service animal hospital',
    details:
      'Dogwood Veterinary Hospital & Pet Resort on Vickers Road combines a full-service veterinary practice with a pet resort offering boarding, daycare, bathing, and grooming for cats and dogs. Because boarding is veterinary-supervised, the resort can handle medication administration and special dietary support alongside private kennels or suites, fresh bedding, and supervised outdoor time. Grooming is tailored to breed and coat type, from routine clean-ups to breed-specific haircuts and help with matting or overgrown nails. Optional bathing or grooming can be added before pick-up from a boarding stay.',
    tags: ['boarding', 'grooming', 'daycare', 'veterinary-supervised', 'medication'],
    contact_email: null,
    contact_phone: '(919) 942-6330',
    location: 'Chapel Hill, NC',
    website: 'https://www.dogwoodvethospital.com/services/pet-boarding-grooming/',
  },
  {
    title: "Noah's Ark Kennel and Cattery",
    summary: 'Long-running East Franklin Street boarding kennel and cattery serving the area since 1997',
    details:
      "Noah's Ark Kennel and Cattery has provided pet boarding and pet sitting for Chapel Hill, Carrboro, and Durham since 1997, operating from East Franklin Street. The facility boards both cats and dogs, with the cattery run as a distinct space from the dog kennel. The business reopened under continued operation in February 2019 after a break. It is one of the longer-established boarding options in the immediate Chapel Hill area.",
    tags: ['boarding', 'cattery', 'kennel', 'established', 'pet-sitting'],
    contact_email: null,
    contact_phone: '(919) 932-7322',
    location: 'Chapel Hill, NC',
    website: 'https://noahsarkkennel.com/',
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
