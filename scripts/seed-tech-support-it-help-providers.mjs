/**
 * One-off seed for tech support and IT help providers near Briar Chapel.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-tech-support-it-help-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'professional-miscellaneous/tech-support-it-help';

const PROVIDERS = [
  {
    title: 'Chapel Hill Tech, LLC',
    summary: 'On-site consulting for homes and small businesses from a 20-year local IT consultant',
    details:
      'Chapel Hill Tech is the practice of David Alexander, who has consulted through it for more than 20 years, helping hundreds of regular clients in Chapel Hill and surrounding areas. He specializes in residential and small business support, working after hours alongside his day role as Chief Information Officer for a North Carolina state agency; he previously served as CIO for a local university. His credentials are unusually deep for residential work: a Business Information Technology degree from Virginia Tech, an MBA from UNC Kenan-Flagler, project management certifications including PMP and Project+, security certifications including CISSP, GCIH, and CISA, and general IT certifications including A+, Linux+, and ITIL. He has also worked as a factory-authorized repair technician for Apple, Dell, IBM, Lenovo, and HP hardware. Appointments are booked through the website.',
    tags: ['residential', 'small-business', 'on-site', 'highly-certified', 'chapel-hill'],
    contact_email: null,
    contact_phone: null,
    location: 'Chapel Hill, NC',
    website: 'https://chapelhilltech.com/',
  },
  {
    title: 'Geeks on Call of the Triangle',
    summary: 'On-site computer and server repair from an East Franklin Street office in Chapel Hill',
    details:
      'Geeks on Call of the Triangle operates from East Franklin Street in Chapel Hill and specializes in coming to you rather than requiring you to drop equipment off, which avoids the multi-day turnaround typical of shop-based repair. Services cover on-site PC and server repair, software and hardware upgrades, managed IT services, cybersecurity, VoIP phone service, and data backup and recovery. The on-site model is aimed particularly at offices that cannot afford disruption while equipment is serviced.',
    tags: ['on-site-repair', 'server-repair', 'managed-it', 'data-recovery', 'chapel-hill'],
    contact_email: 'elmer.hill@1844905geek.com',
    contact_phone: '(844) 905-4335',
    location: 'Chapel Hill, NC',
    website: 'https://www.1844905geek.com/',
  },
  {
    title: 'Computerbilities, Inc.',
    summary: 'Managed IT services provider serving Chapel Hill small and medium businesses for over 30 years',
    details:
      'Computerbilities has served small and medium-sized businesses in the Triangle for over 30 years, with Chapel Hill among its on-site service areas. The company provides fully managed IT services including a 24/7 help desk, on-site support, remote troubleshooting, cybersecurity, cloud services, backup solutions, and IT consulting. Its pitch is giving smaller organizations enterprise-grade technology capability without the cost of an in-house IT team, on predictable pricing. The office is based in Cary, so this is a regional provider rather than a Chatham County local, but it dispatches to Chapel Hill.',
    tags: ['managed-it', 'business-focused', '24-7-helpdesk', 'cybersecurity', 'established'],
    contact_email: 'sales@computerbilities.com',
    contact_phone: '(919) 469-5060',
    location: 'Cary, NC',
    website: 'https://www.computerbilities.com/managed-it-services-chapel-hill-nc/',
  },
  {
    title: 'Petronella Technology Group',
    summary: 'Remote-first managed IT and compliance services for Pittsboro and Chatham County businesses',
    details:
      'Petronella Technology Group provides managed IT services to Pittsboro and Chatham County businesses on a remote-first model, with scheduled on-site support and same-business-day visits for critical issues. Services include remote and on-site help desk, hardware troubleshooting, software support, user account management, printer and peripheral support, and technology onboarding for new employees. Its remote monitoring and management platform gives 24/7 visibility into infrastructure, and the firm documents outcomes such as uptime and compliance in quarterly business reviews. The company notes relationships with Chatham County organizations spanning more than a decade, and is oriented toward the businesses arriving with Chatham Park development. Its office is 35 miles away in Raleigh.',
    tags: ['managed-it', 'pittsboro', 'compliance', 'remote-monitoring', 'business-focused'],
    contact_email: null,
    contact_phone: null,
    location: 'Pittsboro, NC',
    website: 'https://petronellatech.com/it-support-pittsboro-nc/',
  },
  {
    title: 'Carolina Cell Phone Repairs',
    summary: 'Walk-in device repair shop on West Franklin Street with free in-store diagnosis',
    details:
      'Carolina Cell Phone Repairs is a storefront on West Franklin Street in Chapel Hill handling repairs for cell phones, iPads, tablets, computers, and laptops. Diagnosis in store is free, and the shop advertises low prices with evening hours running until 9pm, which makes it the practical option for a cracked screen or a dead laptop when you want a physical counter rather than scheduling an on-site visit. Call or stop in to confirm turnaround on your specific device.',
    tags: ['walk-in', 'phone-repair', 'laptop-repair', 'free-diagnosis', 'chapel-hill'],
    contact_email: null,
    contact_phone: null,
    location: 'Chapel Hill, NC',
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
