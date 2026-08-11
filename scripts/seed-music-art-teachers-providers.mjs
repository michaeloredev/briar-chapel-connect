/**
 * One-off seed for music and art instruction providers in the Chapel Hill / Briar Chapel area.
 *
 * Only established schools and studios are listed here. Individual teachers
 * advertising on gig platforms are deliberately excluded.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-music-art-teachers-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'community-personal-services/music-art-teachers';

const PROVIDERS = [
  {
    title: 'Chapel Hill School of Musical Arts',
    summary: 'Private music lessons, studio classes, and recitals on East Franklin Street',
    details:
      'Chapel Hill School of Musical Arts is a music school on East Franklin Street offering private lessons across instruments and voice. The program extends past the standard weekly lesson to include studio classes, recitals, workshops, master classes, and other performance opportunities, so students get regular experience playing in front of others. The school works from the premise that anyone can learn to play or sing, and takes students across ages and levels. Prospective families start with a consultation to be matched with a teacher.',
    tags: ['music-lessons', 'private-lessons', 'recitals', 'workshops', 'all-ages'],
    contact_email: null,
    contact_phone: '(919) 960-6898',
    location: 'Chapel Hill, NC',
    website: 'https://chapelhillschoolofmusicalarts.com/',
  },
  {
    title: 'School of Rock Chapel Hill',
    summary: 'Performance-based music program on North Fordham Boulevard for guitar, bass, drums, keys, and vocals',
    details:
      'School of Rock Chapel Hill on North Fordham Boulevard teaches through a performance-based model that combines private lessons with group band rehearsals, so students apply what they learn by playing with other musicians. Instruction covers guitar, bass, drums, keyboard, and vocals, with programs for a range of ages and skill levels. The school also runs music camps and workshops, including songwriting and learning to play in a band. Weekday hours run into the evening, which works around school schedules.',
    tags: ['music-lessons', 'band-program', 'performance', 'camps', 'guitar-drums-vocals'],
    contact_email: null,
    contact_phone: '(919) 338-1011',
    location: 'Chapel Hill, NC',
    website: 'https://www.schoolofrock.com/locations/chapelhill',
  },
  {
    title: 'Creative Music Instruction',
    summary: 'Private music instruction in downtown Carrboro, serving the community since 1997',
    details:
      'Creative Music Instruction has offered private music lessons to the Chapel Hill and Carrboro community since 1997 from its studio on West Main Street in downtown Carrboro. Lessons are tailored to the individual interests and goals of each student rather than following a fixed syllabus, and are taught in a friendly, relaxed atmosphere. Instruction covers instruments including piano and keyboard as well as drum set and percussion. The instructors treat their role as mentorship as much as teaching. The studio prefers text contact for initial inquiries.',
    tags: ['music-lessons', 'carrboro', 'piano', 'drums', 'established'],
    contact_email: null,
    contact_phone: '(919) 448-7049',
    location: 'Carrboro, NC',
    website: 'https://www.createinstruct.com/',
  },
  {
    title: "Cely's House Creative Workshops",
    summary: 'Pottery and art classes, after-school programs, and summer camps on Dixie Drive since 2000',
    details:
      "Cely's House on Dixie Drive was founded in 2000 by Chapel Hill natives Bill and Cely Chicurel and has specialized in art and creative workshops for over 25 years. The studio offers pottery classes for all ages in both hand-building and wheel throwing, after-school art programs, summer art camps, birthday parties, and retreats. Cely holds a degree in pottery and weaving and has further study at the Penland and Arrowmont schools of arts and crafts. After-school pottery and art classes run Monday through Friday from 3:30 to 5:30 pm, with open studio time for adults several mornings a week. Painting classes are offered separately, and most Friday nights the studio is open for parents and children to make art together.",
    tags: ['pottery', 'art-classes', 'after-school', 'summer-camp', 'all-ages'],
    contact_email: null,
    contact_phone: '(919) 225-7349',
    location: 'Chapel Hill, NC',
    website: 'https://www.celyshouse.net/',
  },
  {
    title: 'The ArtsCenter ArtSchool',
    summary: 'Quarterly art classes in Carrboro across drawing, painting, ceramics, fiber arts, and more',
    details:
      'The ArtsCenter in Carrboro runs ArtSchool, a quarterly class program for adults and teens spanning drawing, painting, mixed media, ceramics, fiber arts, stained glass, dance, theatre, photography, writing, and arts-based wellness. New sessions open each winter, spring, summer, and fall. Registration can be completed online, by phone during business hours, or in person, and the staff will help match you to a class. Classes with strong demand fill quickly, so registering in advance is recommended. Classes that fall short on enrollment are cancelled one to three days ahead with a full refund.',
    tags: ['art-classes', 'ceramics', 'painting', 'carrboro', 'adults-teens'],
    contact_email: 'artschool@artscenterlive.org',
    contact_phone: '(919) 929-2787',
    location: 'Carrboro, NC',
    website: 'https://artscenterlive.org/artschool-classes/',
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
