/**
 * One-off seed for insurance agencies and financial advisors near Briar Chapel.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-insurance-financial-advisors-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'professional-miscellaneous/insurance-financial-advisors';

const PROVIDERS = [
  {
    title: 'McB Group Insurance Services',
    summary: 'Independent Pittsboro insurance agency backed by Correll Insurance Group',
    details:
      'McB Group Insurance Services operates from Lowes Drive in Pittsboro as an independent agency and a member of Correll Insurance Group, which has served the Carolinas for nearly 95 years. Being independent means the agency is not tied to a single carrier, so it can compare rates and coverage across a network of national carriers rather than offering one company\u2019s product. It covers both personal and commercial lines including car, home, and business insurance. It is a Trusted Choice independent agency, and its primary market is Pittsboro, Siler City, Carrboro, Chapel Hill, Durham, and Raleigh.',
    tags: ['independent-agency', 'pittsboro', 'home-auto', 'commercial', 'trusted-choice'],
    contact_email: 'info@mcbinsure.com',
    contact_phone: '(919) 642-0475',
    location: 'Pittsboro, NC',
    website: 'https://www.correllinsurance.com/insurance-offices/mcb-group-insurance-group-nc',
  },
  {
    title: 'High & Rubish Insurance Agency',
    summary: 'Independent Chapel Hill agency covering auto, home, business, and farm insurance',
    details:
      'High & Rubish Insurance Agency works from Farrington Road in Chapel Hill as an independent agency representing a selected group of financially strong carriers. Coverage spans auto, home, business, and farm insurance, with the farm line being relatively uncommon among Chapel Hill agencies and useful for properties on acreage around Chatham County. As an independent agent the office can approach several carriers to find competitive pricing and knows which carriers handle claims most efficiently. The agency is managed by Jeffrey A. Rubish. Office hours are Monday through Thursday 8:30am to 5pm and Friday 8:30am to 3pm, with a 24-hour online policy service center for payments, claims, and policy changes.',
    tags: ['independent-agency', 'chapel-hill', 'farm-insurance', 'home-auto', 'business'],
    contact_email: null,
    contact_phone: '(919) 913-1144',
    location: 'Chapel Hill, NC',
    website: 'https://highandrubish.com/',
  },
  {
    title: 'Woodward Financial Advisors',
    summary: 'Fiduciary wealth management firm at Glen Lennox offering ongoing planning and investment management',
    details:
      'Woodward Financial Advisors is a fiduciary wealth management firm on Glen Lennox Drive in Chapel Hill. The firm performs ongoing financial planning together with investment management for its clients, and states plainly that it does not offer hourly or project-based engagements, so it is aimed at people seeking a continuing advisory relationship rather than a one-time plan. Prospective clients begin by scheduling an introductory conversation.',
    tags: ['fiduciary', 'wealth-management', 'ongoing-planning', 'chapel-hill', 'investment-management'],
    contact_email: null,
    contact_phone: '(919) 929-2495',
    location: 'Chapel Hill, NC',
    website: 'https://woodwardadvisors.com/',
  },
  {
    title: 'Tarheel Advisors, LLC',
    summary: 'Fee-only CFP practice on Market Street in Chapel Hill, serving clients since 2009',
    details:
      'Tarheel Advisors has provided comprehensive financial planning and investment management to families and businesses since 2009, from an office on Market Street in Chapel Hill inside the 27516 ZIP code. The firm operates strictly fee-only and holds itself to fiduciary standards, working to eliminate conflicts of interest. It deliberately works with a small number of clients, and investment management clients receive planning services at no additional cost. Portfolios are customized, low-fee, and reviewed with clients at least annually, with attention to minimizing taxes. Advisors hold the CERTIFIED FINANCIAL PLANNER designation.',
    tags: ['fee-only', 'cfp', 'fiduciary', 'chapel-hill', 'since-2009'],
    contact_email: null,
    contact_phone: '(984) 271-1993',
    location: 'Chapel Hill, NC',
    website: 'https://tarheeladvisors.com/',
  },
  {
    title: 'Master Plan Wealth Management',
    summary: 'Fee-only Registered Investment Advisor whose founder lives in Pittsboro, meeting locally by arrangement',
    details:
      'Master Plan Wealth Management is an independently owned, fee-only financial planning firm and Registered Investment Advisor operating as a fiduciary. Rather than requiring clients to travel to a single office, it holds meetings at locations across Chapel Hill, Raleigh, Durham, Cary, and Pittsboro, whichever is most convenient. President and founder Philip Royal is a CERTIFIED FINANCIAL PLANNER professional, an active member of the Financial Planning Association, and serves on a local community association finance committee. He lives in Pittsboro. Inquiries go through the website.',
    tags: ['fee-only', 'fiduciary', 'cfp', 'pittsboro', 'flexible-meetings'],
    contact_email: null,
    contact_phone: null,
    location: 'Pittsboro, NC',
    website: 'https://masterplanwealth.com/',
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
