/**
 * One-off seed for childcare providers in the Chapel Hill / Briar Chapel area.
 *
 * Only licensed centers and preschools are listed here. Individual babysitters
 * and nannies advertising on gig platforms are deliberately excluded.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-babysitting-childcare-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'community-personal-services/babysitting-childcare';

const PROVIDERS = [
  {
    title: 'Primrose School of Chapel Hill at Briar Chapel',
    summary: 'Accredited daycare and preschool on Falling Springs Drive, inside Briar Chapel itself',
    details:
      'Primrose School of Chapel Hill at Briar Chapel sits on Falling Springs Drive within the Briar Chapel neighborhood, making it the closest licensed center to residents. Programs cover infants from six weeks through toddler, preschool, pre-kindergarten, kindergarten, after-school, and summer camp, taught through the Primrose Balanced Learning approach. The school is locally owned by Gaurav and Anna Sharma and sits just off the 501 corridor between Pittsboro and Chapel Hill. Every staff member is background checked and CPR and first-aid certified. Hours are Monday through Friday, 7:00 am to 6:00 pm.',
    tags: ['briar-chapel', 'preschool', 'infant-care', 'pre-k', 'summer-camp'],
    contact_email: null,
    contact_phone: '(919) 441-0441',
    location: 'Briar Chapel, Chapel Hill, NC',
    website: 'https://www.primroseschools.com/schools/chapel-hill-at-briar-chapel',
  },
  {
    title: 'Chapel Hill Day Care Center',
    summary: 'Five-star, NAEYC-accredited center in Southern Village for ages 8 weeks to 5 years',
    details:
      'Chapel Hill Day Care Center is a full-day early childhood education program on Kildaire Road in Southern Village, serving children from 8 weeks old through age 5. It holds a five-star rating and is accredited by the National Association for the Education of Young Children, operating under NC License #68000135. The program is relationship-based and uses an evidence-based curriculum spanning infant, toddler, preschool, and pre-K classrooms. Its Southern Village location gives families access to the Park & Ride, the community playground, and nearby shops. Hours are Monday through Friday, 7:30 am to 5:30 pm.',
    tags: ['five-star', 'naeyc-accredited', 'infant-care', 'southern-village', 'licensed'],
    contact_email: 'chdccdirector@gmail.com',
    contact_phone: '(919) 929-3585',
    location: 'Chapel Hill, NC',
    website: 'http://www.chapelhilldaycarecenter.com/',
  },
  {
    title: 'Community School for People under Six',
    summary: 'Five-star Carrboro center operating since 1970 with a multicultural, community-based curriculum',
    details:
      'Community School for People under Six has educated infants, toddlers, and preschoolers in Carrboro since 1970 from its Hargraves Street location. It is a five-star licensed child care center and an NC Pre-Kindergarten program, serving ages 2 months through 8 years and licensed to include students up to age 12. The curriculum is creative, community-based, and multicultural, and the school explicitly prioritizes access for low- and middle-income families while promoting cultural, racial, gender, and socioeconomic diversity. It also provides advanced educational opportunities for its teachers.',
    tags: ['five-star', 'nc-pre-k', 'multicultural', 'nonprofit', 'established'],
    contact_email: null,
    contact_phone: '(919) 929-1543',
    location: 'Carrboro, NC',
    website: 'https://cspu6.org/',
  },
  {
    title: 'Chapel Hill Cooperative Preschool',
    summary: "Chapel Hill's longest-running independent nonprofit preschool, five-star and NAEYC accredited",
    details:
      'Chapel Hill Cooperative Preschool on Mount Carmel Church Road is the longest-running independent, non-profit preschool in Chapel Hill, founded in 1960. It is one of a small number of preschools in town that are both five-star rated and NAEYC accredited. As a cooperative, the school involves parents directly in the program alongside its teaching staff. Enrollment tends to run well ahead of the school year and families frequently join a waitlist, so early inquiry is advisable.',
    tags: ['cooperative', 'nonprofit', 'five-star', 'naeyc-accredited', 'parent-participation'],
    contact_email: null,
    contact_phone: '(919) 942-3955',
    location: 'Chapel Hill, NC',
    website: 'https://www.chapelhillcoop.com/',
  },
  {
    title: 'The Goddard School of Chapel Hill',
    summary: 'Accredited preschool and daycare on Martin Luther King Jr. Boulevard, open 7am to 6pm',
    details:
      'The Goddard School of Chapel Hill is an accredited preschool and daycare on Martin Luther King Jr. Boulevard north of downtown. It follows the Goddard play-based learning approach across infant, toddler, preschool, and pre-kindergarten programs. The school operates Monday through Friday from 7:00 am to 6:00 pm, which accommodates full working days. It is one of the more centrally located options for families commuting toward Hillsborough or I-40.',
    tags: ['preschool', 'daycare', 'play-based', 'accredited', 'full-day'],
    contact_email: null,
    contact_phone: '(919) 933-9022',
    location: 'Chapel Hill, NC',
    website: 'https://www.goddardschool.com/schools/nc/chapel-hill/chapel-hill',
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
