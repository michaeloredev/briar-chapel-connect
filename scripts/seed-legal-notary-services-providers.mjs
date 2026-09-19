/**
 * One-off seed for legal and notary providers near Briar Chapel.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-legal-notary-services-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'professional-miscellaneous/legal-notary-services';

const PROVIDERS = [
  {
    title: 'Bradshaw Robinson Slawter & Rainer LLP',
    summary: 'Pittsboro firm focused on real estate, land use and zoning, and business law',
    details:
      'Bradshaw Robinson Slawter & Rainer LLP practices from the Hall-London House on Hillsboro Street in downtown Pittsboro, a Federal and Greek Revival home built in 1836 and listed on the National Register of Historic Places since 1982; the firm and its predecessors have occupied it since it was converted to offices in the 1980s. Practice areas cover real estate and finance including acquisition, financing, leasing, development, and sale of property; land use and zoning including subdivision and development regulations; and corporate and business law including entity formation, contracts, and asset purchases. Clients range from regional and national developers to small family-owned businesses and startups. The firm is centrally located between the Research Triangle and the Piedmont Triad.',
    tags: ['real-estate-law', 'land-use', 'zoning', 'business-law', 'pittsboro'],
    contact_email: 'law@bradshawrobinson.com',
    contact_phone: '(919) 542-2400',
    location: 'Pittsboro, NC',
    website: 'https://brsrllp.com/',
  },
  {
    title: 'Bagwell Holt Smith P.A.',
    summary: 'Multi-practice firm with a Southern Village office, serving Chapel Hill and Pittsboro for 40+ years',
    details:
      'Bagwell Holt Smith P.A. has served individuals, families, and businesses in the area for more than 40 years and keeps two Chapel Hill offices, one at Eastowne Office Park on Cloister Court and one in Southern Village on Market Street inside the 27516 ZIP code. Practice areas span residential and commercial real estate, estate planning and probate, family law, business law, community association law, civil litigation, personal injury, and workers\u2019 compensation. Community association law is worth noting for residents of an HOA-governed neighborhood like Briar Chapel. Real estate and estate planning attorneys explicitly serve Pittsboro alongside Chapel Hill. The consultation fee for an initial estate administration meeting is $350, payable in advance.',
    tags: ['estate-planning', 'real-estate-closings', 'hoa-law', 'southern-village', 'established'],
    contact_email: null,
    contact_phone: '(919) 932-2225',
    location: 'Chapel Hill, NC',
    website: 'https://bhspa.com/',
  },
  {
    title: 'Hopper Cummings, PLLC',
    summary: 'Family law and estate planning firm with deep Chatham County roots in downtown Pittsboro',
    details:
      'Hopper Cummings, PLLC works from the historic Terry-Taylor House in downtown Pittsboro and serves clients throughout Chatham and Orange counties, including Chapel Hill, Hillsborough, and Siler City. Marie Hopper is a Chatham County native, a UNC School of Law graduate, and a former President of the 18th Judicial District Bar. Robert S. Cummings is a North Carolina native, a Campbell University School of Law graduate, and brings Board Certified Family Law credentials. Family law work covers divorce and separation, child custody and support, spousal support, domestic violence proceedings, adoption, and modification or enforcement of existing orders. Estate planning covers wills, trusts, powers of attorney, guardianship, and probate administration. The firm states its representation is built around resolution rather than prolonged litigation.',
    tags: ['family-law', 'estate-planning', 'board-certified', 'probate', 'chatham-county'],
    contact_email: 'info@hoppercummings.com',
    contact_phone: '(919) 533-4115',
    location: 'Pittsboro, NC',
    website: 'https://hoppercummings.com/',
  },
  {
    title: 'Ellis Family Law, P.L.L.C.',
    summary: 'Board certified family law and estate planning boutique with a Pittsboro office on Hillsboro Street',
    details:
      'Ellis Family Law, P.L.L.C. is a boutique family law and estate planning firm with a Pittsboro office on Hillsboro Street, alongside locations in Durham, Cary, and Wake Forest. The firm is led by board certified specialist Gray Ellis and has been named to the Legal Elite list of law firms by Business North Carolina. Family law work covers divorce, child custody and support, property division, spousal support, prenuptial agreements, high-asset and gray divorce, and LGBT family law matters. Estate planning covers wills, trusts, and powers of attorney, with the firm noting it applies knowledge of Chatham County property values, development trends, and local tax considerations to planning strategy. Clients speak directly with the attorney from the first consultation.',
    tags: ['family-law', 'board-certified', 'estate-planning', 'divorce', 'pittsboro'],
    contact_email: null,
    contact_phone: '(919) 688-9400',
    location: 'Pittsboro, NC',
    website: 'https://ellisfamilylaw.com/pittsboro/family-law-attorneys/',
  },
  {
    title: 'Law Offices of Doster & Brown, P.A.',
    summary: 'Estate planning and probate practice on Hillsboro Street in Pittsboro, by appointment only',
    details:
      'The Law Offices of Doster & Brown, P.A. maintain an office on Hillsboro Street in downtown Pittsboro handling estate planning and probate matters. The Pittsboro office operates by appointment only rather than keeping walk-in hours, so contact should be arranged in advance. Note that a direct phone number for this office was not published in the sources available, so reaching them may require going through their main practice contact.',
    tags: ['estate-planning', 'probate', 'pittsboro', 'by-appointment', 'wills'],
    contact_email: null,
    contact_phone: null,
    location: 'Pittsboro, NC',
    website: null,
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
