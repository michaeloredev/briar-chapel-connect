/**
 * One-off seed for local artisans and craftspeople near Briar Chapel.
 *
 * Working artists are inherently individual, so named studios are included
 * here provided they operate a real studio or gallery open to the public.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-local-artisans-craftspeople-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'professional-miscellaneous/local-artisans-craftspeople';

const PROVIDERS = [
  {
    title: 'Chatham Artists Guild',
    summary: 'Guild of 60-70 Chatham County visual artists behind the annual December Open Studio Tour',
    details:
      'The Chatham Artists Guild is an organization of visual artists who live and work in Chatham County, currently around 60 to 70 members, and it is the best single starting point for finding local makers. Its signature event is the Annual Studio Tour, held the first two weekends each December, where artists open their private studios across the county for a free, self-guided drive through the countryside; the 2025 tour featured 59 artists across 41 studios. It is one of the oldest studio tours in the state and served as a prototype for others in the region. Individual artist pages on the Guild site include information about each maker and a gallery of their work, so the directory is useful year-round. Guild members also work as teaching artists and mentors through education outreach including the Annual Student Art Show and an Emerging Artists Program for Chatham and Orange high school students.',
    tags: ['artist-guild', 'studio-tour', 'chatham-county', 'directory', 'nonprofit'],
    contact_email: 'chathamartists@gmail.com',
    contact_phone: '(919) 593-7541',
    location: 'Pittsboro, NC',
    website: 'https://chathamartistsguild.org/',
  },
  {
    title: 'Mark Hewitt Pottery',
    summary: 'Nationally recognized wood-fired pottery made in Pittsboro since 1983, open by appointment',
    details:
      'Mark Hewitt has made functional and decorative pots in Pittsboro since 1983, using locally sourced North and South Carolina clays and glaze materials and firing them in one of two very large wood-burning kilns. His work blends Southern craft traditions with influences gathered studying pottery in Europe, Asia, Africa, Australia, and North America. He received a North Carolina Heritage Award and was honored at the Archie Bray Foundation in Montana for contributions to the ceramic arts. The barn and showroom is open year round by appointment, and twice a year the studio holds a Kiln Opening across two to three weekends, when 1500 or more freshly fired pots fill the barn and yard and visitors can meet Mark and see the kilns. Every pot is identified by maker, kiln, and date. Call to arrange a visit.',
    tags: ['pottery', 'wood-fired', 'by-appointment', 'kiln-openings', 'award-winning'],
    contact_email: null,
    contact_phone: '(919) 542-2371',
    location: 'Pittsboro, NC',
    website: 'https://hewittpottery.com/',
  },
  {
    title: 'Janet Resnik Pottery',
    summary: 'Affordable functional stoneware from a Chatham County farm studio on Collins Mountain Road',
    details:
      'Janet Resnik makes and sells functional stoneware designed and priced for everyday use, from a combined studio and gallery on a Chatham County farm on Collins Mountain Road. The work reflects its setting, with plates, mugs, bowls, pitchers, and platters featuring impressionistic landscape, animal, iris, and Christmas designs. Janet does all the wheel throwing and all the glazing, while assistants including her husband Mike work the slab roller. Pieces are bisque fired in a low-temperature electric kiln, then glazed and fired again at high temperature, mostly electric with a gas kiln for certain glazes. Prices are modest, with a spoon rest around $4, a dinner plate $24, and a large bowl or bird bath $65. Pottery is lead free, dishwasher safe, and oven safe if started cold. The studio is open Sundays and Wednesdays 3 to 6pm and by appointment. Note that credit cards are not accepted; there is a 20 percent discount for cash and 15 percent for checks, and pieces cannot be purchased online.',
    tags: ['pottery', 'functional-stoneware', 'affordable', 'farm-studio', 'cash-or-check'],
    contact_email: null,
    contact_phone: '(919) 929-3324',
    location: 'Chapel Hill, NC',
    website: 'http://www.janetresnikpottery.com/',
  },
  {
    title: 'Rudy Duo Studio',
    summary: 'Pittsboro ceramics studio run by a husband-and-wife pair, collaborating with other local artists',
    details:
      'Rudy Duo Studio is a Pittsboro art space run by Josh and Addie Rudy, a married couple whose primary focus is ceramics including sculpting, throwing, glazing, and kiln firing. Beyond their own ceramics work they collaborate with other artists across different media, with the stated aim of making more art forms accessible to people interested in trying them. The studio publishes a newsletter called Pottery Throw for updates on work and events. Contact is through the studio website.',
    tags: ['ceramics', 'pittsboro', 'sculpture', 'collaborative', 'local-makers'],
    contact_email: null,
    contact_phone: null,
    location: 'Pittsboro, NC',
    website: 'https://www.rudyduostudio.com/',
  },
  {
    title: 'Doug Dotson Pottery',
    summary: 'Pittsboro studio potter making soda-fired functional ware and teaching soda firing classes',
    details:
      'Doug Dotson is a studio potter in Pittsboro producing soda-fired functional pottery that he describes as earthy, lively, and usable. Soda firing is a distinctive process where soda is introduced into the kiln at high temperature, producing surface variation that differs piece to piece. Beyond selling his own work he teaches soda firing classes from the studio, which makes this a good option if you want to learn the process rather than just buy the results. He also exhibits at national ceramics shows. Updates on new work and upcoming classes go out through an email list on the website.',
    tags: ['pottery', 'soda-fired', 'classes', 'pittsboro', 'functional-ware'],
    contact_email: null,
    contact_phone: null,
    location: 'Pittsboro, NC',
    website: 'https://dougdotsonpottery.com/',
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
