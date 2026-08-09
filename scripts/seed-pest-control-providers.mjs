/**
 * One-off seed for pest control providers in the Chapel Hill / Briar Chapel area.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-pest-control-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'home-property-services/pest-control';

const PROVIDERS = [
  {
    title: 'Sawyer Termite & Pest Control',
    summary: 'Family-owned Pittsboro termite and pest specialists serving Chatham County for over 50 years',
    details:
      'Sawyer Termite & Pest Control is a Pittsboro-based, family-owned company that has handled pest management for more than 50 years and is BBB accredited back to 1992. They specialize in termites but treat everything from ants to rodents, for both residential and commercial properties, with one-time treatments or ongoing maintenance. Technicians are trained, certified, and registered, and the company belongs to both the North Carolina Pest Management Association and the National Pest Management Association. Free estimates are available.',
    tags: ['family-owned', 'termite', 'chatham-county', 'free-estimate', 'commercial'],
    contact_email: null,
    contact_phone: '(919) 967-1500',
    location: 'Pittsboro, NC',
    website: 'https://www.sawyerpestcontrol.com/',
  },
  {
    title: 'Kind Pest Control',
    summary: 'Eco-friendly, locally owned pest control based in Carrboro with 2,100+ five-star reviews',
    details:
      'Kind Pest Control is a locally owned company operating from a Carrboro office and serving Chapel Hill, Hillsborough, and all of Orange County. They use EPA-registered treatments for ants, mosquitoes, termites, cockroaches, rodents, and bed bugs, and also address crawl space moisture issues. The company plants a tree for every service completed through a partnership with the nonprofit One Tree Planted, and holds over 2,100 five-star Google reviews.',
    tags: ['eco-friendly', 'local', 'licensed', 'mosquito', 'termite', 'rodent'],
    contact_email: 'info@kindpest.com',
    contact_phone: '(919) 981-9798',
    location: 'Carrboro & Chapel Hill, NC',
    website: 'https://www.kindpest.com/chapel-hill/',
  },
  {
    title: 'Innovative Pest Solutions',
    summary: 'Third-generation family business serving 27516 since 2002, with plans starting around $30/month',
    details:
      'Innovative Pest Solutions is a family-owned company founded in 2002 that explicitly lists 27516 among its service ZIP codes and names Briar Chapel as a neighborhood it covers. Founder Kevin Spillman is a third-generation pest control operator, a past president of the North Carolina Pest Management Association, and an Associate Certified Entomologist. Treatments follow Integrated Pest Management principles with pet- and family-friendly products, and recurring plans start around $30 per month. Scheduling is available by phone, text, or email, and inspections are free.',
    tags: ['family-owned', 'certified-entomologist', 'ipm', 'pet-friendly', 'free-inspection'],
    contact_email: null,
    contact_phone: '(919) 847-6267',
    location: 'Chapel Hill & Briar Chapel, NC',
    website: 'https://www.innovativepest.com/27514-27516-27517-chapel-hill-nc-pest-control/',
  },
  {
    title: 'Invicta Pest Control',
    summary: 'Mom-owned company with a Board Certified Entomologist and NC State wildlife biologist on staff',
    details:
      'Invicta Pest Control is a mom-owned, family-focused company serving Chapel Hill and the wider Triangle. The team includes a Board Certified Entomologist with 20 years of experience and a Wildlife Biologist from NC State. They hold QualityPro and GreenPro certifications, all technicians are NC-certified, background checked, and drug tested, and the company operates under NC Pest Control License #2480PW. Their mosquito program runs April through September using a lawn-applied treatment rather than fogging, which avoids chemical drift onto neighboring yards. Inspections are free, pricing is quoted upfront, and there are no cancellation penalties.',
    tags: ['mom-owned', 'entomologist', 'qualitypro', 'greenpro', 'mosquito', 'no-contract'],
    contact_email: null,
    contact_phone: '(984) 367-4198',
    location: 'Chapel Hill & Triangle, NC',
    website: 'https://invictapest.com/pest-control-chapel-hill-nc/',
  },
  {
    title: 'Triangle Pest Control',
    summary: 'Regional provider with a downtown Chapel Hill office and same-day service on morning calls',
    details:
      'Triangle Pest Control operates a Chapel Hill office on North Columbia Street and serves the surrounding neighborhoods, including Briar Chapel. Their residential program provides quarterly visits with an exterior perimeter barrier treatment, wasp nest removal from eaves, and targeted interior treatments, covering ants, spiders, roaches, crickets, and silverfish. Seasonal mosquito control and rodent exclusion for attics and crawl spaces are also offered. Calls placed before noon can generally get a licensed technician out for a same-day inspection.',
    tags: ['same-day', 'quarterly', 'mosquito', 'rodent', 'local-office'],
    contact_email: 'contact@trianglepest.com',
    contact_phone: '(919) 283-3205',
    location: 'Chapel Hill, NC',
    website: 'https://www.trianglepest.com/pest-control-chapel-hill/',
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
