/**
 * One-off seed for restaurants and cafes near Briar Chapel.
 *
 * Weighted toward the Veranda shops at the US 15-501 entrance to Briar Chapel,
 * which is the closest cluster of dining to the neighborhood.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-local-restaurants-cafes-providers.mjs
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { createClient } from '@supabase/supabase-js';

const CATEGORY = 'food-hospitality/local-restaurants-cafes';

const PROVIDERS = [
  {
    title: 'Breakaway Cafe',
    summary: 'Coffee shop and cafe in the Veranda, opened in 2016 by Briar Chapel residents',
    details:
      'Breakaway Cafe sits on Chapelton Court in the Veranda at Briar Chapel and was opened in the fall of 2016 by Andy and Amy, who live in the neighborhood themselves. The pair met working at a coffee shop in the late 1990s and bonded over single-origin coffees, and built Breakaway on the premise of great food, great drinks, and great people after noticing the neighborhood had nowhere nearby to get either. Many residents treat it as a third place alongside home and work. A second location later opened in Carrboro, though the two locations run different menus. Hours are Monday through Friday 8am to 9pm, Saturday 8am to 3pm, and Sunday 8am to 2pm, with online ordering available.',
    tags: ['briar-chapel', 'coffee', 'cafe', 'breakfast', 'locally-owned'],
    contact_email: null,
    contact_phone: '(984) 234-3010',
    location: 'Briar Chapel, Chapel Hill, NC',
    website: 'https://breakawaync.co/',
  },
  {
    title: "Capp's Pizzeria & Trattoria",
    summary: 'Family-run wood-fired pizzeria on Falling Springs Drive in the Veranda shops',
    details:
      "Capp's Pizzeria & Trattoria is a family-run artisan pizzeria on Falling Springs Drive in the Veranda shops at the US 15-501 entrance to Briar Chapel. The kitchen turns out seasonal wood-fired Neo-Neapolitan pizzas alongside New Haven style apizza, house-made pastas, fresh salads, and desserts, built around seasonal ingredients. Ordering is available online or by phone for pickup, with pickup windows quoted within about 15 minutes. The restaurant is closed Mondays and open Tuesday through Sunday from 4:00 pm to 8:00 pm.",
    tags: ['briar-chapel', 'pizza', 'wood-fired', 'italian', 'family-run'],
    contact_email: null,
    contact_phone: '(919) 240-4104',
    location: 'Briar Chapel, Chapel Hill, NC',
    website: 'https://cappspizzeria.com/',
  },
  {
    title: 'Town Hall Burger & Beer - Briar Chapel',
    summary: 'Burger joint on Chapelton Court, open daily for dine-in and takeout',
    details:
      'Town Hall Burger & Beer operates a Briar Chapel location on Chapelton Court in the Veranda, serving burgers and beer for both dine-in and takeout. It is one of the anchor spots in what Briar Chapel describes as the front porch of the community, where residents can grab a burger, have a drink by the outdoor fireplace, or catch live music. Hours run Monday through Saturday 11:00 am to 9:00 pm and Sunday 11:00 am to 8:00 pm.',
    tags: ['briar-chapel', 'burgers', 'beer', 'dine-in', 'takeout'],
    contact_email: null,
    contact_phone: '(984) 234-3504',
    location: 'Briar Chapel, Chapel Hill, NC',
    website: 'https://www.townhallburgerandbeer.com/briar-chapel',
  },
  {
    title: "O'Ya Cantina",
    summary: 'Cantina in the Briar Chapel Veranda from the founders of Town Hall Burger & Beer',
    details:
      "O'Ya Cantina opened in the Veranda at Briar Chapel in 2020 and comes from the same founders behind Town Hall Burger & Beer. It rounds out the Veranda dining lineup alongside Breakaway Cafe, Capp's Pizzeria, and Town Hall, giving residents a fourth option without leaving the neighborhood. Orders can be placed through the restaurant website or by phone.",
    tags: ['briar-chapel', 'cantina', 'mexican', 'takeout', 'veranda'],
    contact_email: null,
    contact_phone: '(984) 999-4129',
    location: 'Briar Chapel, Chapel Hill, NC',
    website: 'https://www.briarchapelnc.com/shop-dine/',
  },
  {
    title: 'Fearrington Village',
    summary: 'Fine dining, cafe, and village shops in Pittsboro, a short drive down 15-501',
    details:
      'Fearrington Village sits in the countryside between Briar Chapel and Pittsboro and has been a destination for more than 50 years. The property includes The Fearrington House Restaurant for fine dining with paired wines, an inn, a spa, and a cluster of village shops that includes one of the South\u2019s most respected independent bookstores. It also hosts weddings and special events through a dedicated banquet and events team. The Village Shops are open Wednesday through Sunday from 10am to 5pm. It is the closest special-occasion dining to the neighborhood.',
    tags: ['fine-dining', 'pittsboro', 'special-occasion', 'inn', 'shops'],
    contact_email: null,
    contact_phone: '(919) 542-2121',
    location: 'Pittsboro, NC',
    website: 'https://fearrington.com/',
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
