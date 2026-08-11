/**
 * One-off seed for tutoring and after-school providers in the Chapel Hill / Briar Chapel area.
 *
 * Only established centers and organizations are listed here. Individual tutors
 * advertising on gig platforms are deliberately excluded.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-tutoring-after-school-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'community-personal-services/tutoring-after-school';

const PROVIDERS = [
  {
    title: 'Sylvan Learning of Chapel Hill',
    summary: 'K-12 tutoring and test prep at Governors Drive, also serving Chatham County',
    details:
      'Sylvan Learning of Chapel Hill operates from Governors Drive and covers K-12 tutoring, college and career readiness, and test preparation. Instruction starts with the Sylvan Insight assessment, which establishes where a student currently stands before a personalized plan is built. Tutors are selected in part for their familiarity with local curriculum so lessons connect to what students are covering in Chapel Hill schools. The center lists Chatham County, Chapel Hill, Carrboro, and Orange County in its service area, and is open weekdays with Saturday morning hours.',
    tags: ['k-12', 'test-prep', 'assessment', 'reading', 'math'],
    contact_email: null,
    contact_phone: '(984) 333-9979',
    location: 'Chapel Hill, NC',
    website: 'https://www.sylvanlearning.com/locations/us/nc/chapel-hill-tutoring/chapel-hill/',
  },
  {
    title: 'Mathnasium of Chapel Hill',
    summary: 'Math-only learning center on Fordham Boulevard for K-12 students, in-center or online',
    details:
      'Mathnasium of Chapel Hill is a learning center on Fordham Boulevard that focuses exclusively on mathematics for K-12 students. The Mathnasium Method begins with an assessment that identifies specific gaps, then builds a customized learning plan rather than following a fixed curriculum. Sessions are available both in-center and online. Because the center specializes rather than covering all subjects, it is a strong fit for students whose difficulty is concentrated in math.',
    tags: ['math', 'k-12', 'assessment', 'in-center', 'online'],
    contact_email: null,
    contact_phone: '(919) 490-5151',
    location: 'Chapel Hill, NC',
    website: 'https://www.mathnasium.com/math-centers/chapelhill',
  },
  {
    title: 'Clinical Teaching Tutors',
    summary: 'Long-established local tutoring and academic coaching practice serving the area since 1968',
    details:
      'Clinical Teaching has provided tutoring and academic coaching in Chapel Hill and the Triangle since 1968, operating from Franklin Square on East Franklin Street. Services span academic coaching seven days a week, coaching for students with ADHD, learning differences, and dyslexia, homework and study support, ESL, and test preparation for the SAT, ACT, PSAT, SSAT, ISEE, GRE, PRAXIS, and end-of-grade and end-of-course exams. The practice also supports AP and honors coursework, offers school advocacy consulting, and serves as an approved distance testing site. Tutoring can take place at their office, a student home, a school, or a library.',
    tags: ['established', 'academic-coaching', 'adhd-support', 'test-prep', 'esl'],
    contact_email: 'jlocts@aol.com',
    contact_phone: '(919) 967-5776',
    location: 'Chapel Hill, NC',
    website: 'http://www.clinicalteachingtutors.com/services',
  },
  {
    title: 'The Princeton Review - Chapel Hill',
    summary: 'Test prep courses and private tutoring from a local office on North Merritt Mill Road',
    details:
      'The Princeton Review maintains a Chapel Hill office on North Merritt Mill Road inside the 27516 ZIP code. Programs cover tutoring in math, science, English, and social studies alongside homework help, plus test preparation for the ACT, SAT, PSAT, AP exams, SSAT, ISEE, TOEFL, and graduate exams including the GRE, GMAT, LSAT, and MCAT. Courses are offered both in person and online. Enrollment runs through a national line rather than the local office directly.',
    tags: ['test-prep', 'sat-act', 'graduate-exams', 'in-person', 'online'],
    contact_email: null,
    contact_phone: '(800) 273-8439',
    location: 'Chapel Hill, NC',
    website: 'https://www.princetonreview.com/locations/us/north-carolina/chapel-hill-nc',
  },
  {
    title: 'RENA Community Center After-School Tutoring',
    summary: 'Free after-school tutoring for grades 1-10 run by the Rogers-Eubanks Neighborhood Association',
    details:
      'The Rogers-Eubanks Neighborhood Association Community Center on Edgar Street runs a free after-school tutoring program for roughly 30 students in grades 1 through 10, covering math, reading, spelling, and end-of-grade test preparation. The program is overseen by Karen Reid, an award-winning retired teacher from the Chapel Hill-Carrboro City School District, and most tutors are UNC students. Staff coordinate directly with each student\u2019s teachers and counselor to target the areas needing the most help. Sessions run mid-September through the first week of May, Monday through Thursday from 3:00 to 5:30 pm, with snacks included. Beginning in February the focus shifts to end-of-grade test preparation, with pre- and post-testing to measure progress.',
    tags: ['free', 'nonprofit', 'after-school', 'eog-prep', 'grades-1-10'],
    contact_email: null,
    contact_phone: null,
    location: 'Chapel Hill, NC',
    website: 'https://www.renacommunitycenter.com/after-school-tutoring',
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
