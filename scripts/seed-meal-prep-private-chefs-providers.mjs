/**
 * One-off seed for meal prep and private chef providers near Briar Chapel.
 *
 * Private chefs are inherently individual operators, so unlike other categories
 * this list includes sole proprietors, provided they run under a real business
 * name with an established business website.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-meal-prep-private-chefs-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'food-hospitality/meal-prep-private-chefs';

const PROVIDERS = [
  {
    title: 'The Travelling Cafe',
    summary: 'Personal chef service for special dietary needs, explicitly serving Pittsboro and Chapel Hill',
    details:
      'The Travelling Cafe is a collective of personal chefs offering chef-prepared meals, dinner parties, and private cooking classes, with a stated service area that includes Chapel Hill, Carrboro, Pittsboro, Hillsborough, Durham, Cary, Apex, and Raleigh. The kitchen specializes in globally inspired menus built around dietary restrictions, with chefs trained for food allergies, AIP and autoimmune protocol, vegetarian, vegan, paleo, ketogenic, and low FODMAP diets. Service begins with a food questionnaire and an assessment, after which meals are cooked in your home or delivered, then packaged and labeled for quick finishing. Plans run weekly, bi-weekly, or monthly, and pricing is published on the website starting around $325 plus groceries for six meals. New clients save 15 percent when paying monthly in advance.',
    tags: ['dietary-needs', 'allergy-friendly', 'pittsboro', 'cooking-classes', 'published-pricing'],
    contact_email: 'leslie@thetravellingcafe.com',
    contact_phone: '(919) 444-2840',
    location: 'Chapel Hill, NC',
    website: 'https://thetravellingcafe.com/',
  },
  {
    title: 'Custom Chef NC',
    summary: 'ServSafe licensed and insured personal chef service with weekly, bi-weekly, or monthly visits',
    details:
      'Custom Chef NC provides personal chef service where the chef shops for fresh ingredients, cooks a week of meals in your own kitchen, and cleans up afterward. The service is ServSafe licensed and fully insured. Sessions can be booked weekly, bi-weekly, or monthly with no long-term contract required. Menus can be selected from an existing list or fully customized, and the kitchen accommodates low sodium, diabetic, gluten free, and other dietary requirements. The company notes this suits seniors who need meals matched to a specific diet, and it also handles event catering. Free quotes are available by phone.',
    tags: ['servsafe-licensed', 'insured', 'no-contract', 'dietary-accommodations', 'in-home'],
    contact_email: null,
    contact_phone: '(919) 937-0665',
    location: 'Chapel Hill, NC',
    website: 'https://customchefnc.com/services/personal-chef/',
  },
  {
    title: 'Kristen Russell, Personal Chef',
    summary: 'Weekly meal prep and private dinners for Triangle families, cooked in your home',
    details:
      'Kristen Russell is a personal chef working across the Triangle, offering weekly meal prep alongside private dinner parties and special-occasion meals. Her weekly service covers planning, cooking, and organizing healthy dinners in the client\u2019s own kitchen, with menus that rotate rather than repeat so families are regularly introduced to new ingredients. Client reviews consistently note that she handles all dishes and trash and leaves the kitchen as she found it. She also takes on smaller elegant dinners, including multi-course birthday meals with personalized menus.',
    tags: ['weekly-meal-prep', 'dinner-parties', 'in-home', 'rotating-menus', 'triangle'],
    contact_email: null,
    contact_phone: '(919) 504-6640',
    location: 'Chapel Hill, NC',
    website: 'https://www.chefkristenr.com/',
  },
  {
    title: 'Camellia Culinary',
    summary: 'Nutritionally tailored in-home meal prep service based in Chapel Hill',
    details:
      'Camellia Culinary is a Chapel Hill in-home meal prep service built around nutritionally tailored menus, run by Lisa and Elizabeth. Clients book on a weekly, biweekly, or monthly basis, and the team works to match both dietary requirements and family preferences rather than offering a fixed menu. Reviews describe work spanning macro-friendly meal prep for athletes through family cooking for households with young children. The business also runs a bake shop alongside its kitchen service. Inquiries go through the contact form on the website.',
    tags: ['nutrition-focused', 'in-home', 'chapel-hill', 'bake-shop', 'custom-menus'],
    contact_email: null,
    contact_phone: null,
    location: 'Chapel Hill, NC',
    website: 'https://camelliaculinary.org/',
  },
  {
    title: 'Your Painted Plate',
    summary: 'Weekly chef-prepared meal delivery in Chapel Hill, limited to a small client roster',
    details:
      'Your Painted Plate provides weekly meal delivery in Chapel Hill for a deliberately limited number of households, so the chef can build around each client\u2019s routine and preferences over time. Meals are prepared in the chef\u2019s own kitchen, delivered, and organized for immediate use, refrigeration, and freezing with instructions for the week. The Meal Prep Flow approach builds each week from a few core proteins, vegetables, and sauces that recombine across meals, producing variety without excess complexity. The chef has over six years of experience with a background that includes Eleven Madison Park, Dominique Ansel, and \u00c9cole Ducasse, plus vegan recipe development work. Service runs on a monthly retainer and begins with a paid consultation that is credited toward the first month.',
    tags: ['meal-delivery', 'weekly', 'limited-clients', 'gourmet', 'monthly-retainer'],
    contact_email: 'admin@yourpaintedplate.com',
    contact_phone: null,
    location: 'Chapel Hill, NC',
    website: 'https://www.yourpaintedplate.com/chapelhillmealprep',
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
