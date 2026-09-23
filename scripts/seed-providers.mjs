/**
 * Seed service providers into the `services` table.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-providers.mjs                  # every category
 *   node --env-file=.env.local scripts/seed-providers.mjs cleaning-services
 *   node --env-file=.env.local scripts/seed-providers.mjs --list
 *
 * Provider data lives one module per category in scripts/providers/, each
 * exporting CATEGORY and PROVIDERS. Adding a category means adding a file
 * there -- this runner picks it up with no changes.
 *
 * Rows are owned by the single superadmin in user_roles. Set SEED_OWNER_USER_ID
 * to a Clerk user ID to override that, which is required when more than one
 * superadmin exists.
 *
 * Safe to re-run: a provider is skipped when a row with the same title already
 * exists in the same category.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(SCRIPT_DIR, 'providers');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function availableSlugs() {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.mjs'))
    .map((f) => f.replace(/\.mjs$/, ''))
    .sort();
}

async function loadCategory(slug) {
  const mod = await import(pathToFileURL(join(DATA_DIR, `${slug}.mjs`)).href);
  const { CATEGORY, PROVIDERS } = mod;

  if (typeof CATEGORY !== 'string' || !CATEGORY.includes('/')) {
    throw new Error(`${slug}.mjs: CATEGORY must be "<section-slug>/<service-slug>"`);
  }
  if (!Array.isArray(PROVIDERS)) {
    throw new Error(`${slug}.mjs: PROVIDERS must be an array`);
  }
  return { slug, category: CATEGORY, providers: PROVIDERS };
}

/**
 * The composite category only resolves if both halves exist in the static
 * taxonomy -- a typo inserts rows that no page can ever query, since
 * /services/[category]/[service] filters on an exact match. Read the slugs
 * straight out of the source rather than importing it, since this is plain
 * Node and lib/data/services.ts is TypeScript.
 */
function taxonomySlugs() {
  try {
    const src = readFileSync(join(SCRIPT_DIR, '..', 'lib', 'data', 'services.ts'), 'utf8');
    return new Set([...src.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]));
  } catch {
    return null; // Not fatal: skip the check rather than block seeding.
  }
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

async function seedCategory(supabase, ownerUserId, { slug, category, providers }) {
  console.log(`\n${slug}  (${category})`);
  let inserted = 0;
  let skipped = 0;

  for (const provider of providers) {
    const { data: existing, error: lookupError } = await supabase
      .from('services')
      .select('id')
      .eq('category', category)
      .eq('title', provider.title)
      .maybeSingle();

    if (lookupError) {
      console.error(`  lookup failed for "${provider.title}": ${lookupError.message}`);
      process.exitCode = 1;
      continue;
    }

    if (existing) {
      console.log(`  skip    ${provider.title} (already exists)`);
      skipped += 1;
      continue;
    }

    const { error: insertError } = await supabase.from('services').insert({
      user_id: ownerUserId,
      title: provider.title,
      summary: provider.summary,
      details: provider.details,
      category,
      tags: provider.tags,
      contact_email: provider.contact_email,
      contact_phone: provider.contact_phone,
      location: provider.location,
      website: provider.website,
      status: 'active',
      image_url: null,
    });

    if (insertError) {
      console.error(`  insert failed for "${provider.title}": ${insertError.message}`);
      process.exitCode = 1;
      continue;
    }

    console.log(`  insert  ${provider.title}`);
    inserted += 1;
  }

  return { inserted, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const slugs = availableSlugs();

  if (args.includes('--list')) {
    console.log(`${slugs.length} categories:\n${slugs.map((s) => `  ${s}`).join('\n')}`);
    return;
  }

  const requested = args.filter((a) => !a.startsWith('--'));
  const unknown = requested.filter((s) => !slugs.includes(s));
  if (unknown.length > 0) {
    console.error(`Unknown category: ${unknown.join(', ')}\nRun with --list to see all ${slugs.length}.`);
    process.exit(1);
  }

  const targets = await Promise.all((requested.length > 0 ? requested : slugs).map(loadCategory));

  const known = taxonomySlugs();
  if (known) {
    for (const { slug, category } of targets) {
      const [section, service] = category.split('/');
      if (!known.has(section) || !known.has(service)) {
        console.warn(
          `warning: ${slug}.mjs has category "${category}", which does not match ` +
            'lib/data/services.ts. Rows seeded under it will not appear on any page.',
        );
      }
    }
  }

  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ownerUserId = await resolveOwnerUserId(supabase);

  let inserted = 0;
  let skipped = 0;
  for (const target of targets) {
    const result = await seedCategory(supabase, ownerUserId, target);
    inserted += result.inserted;
    skipped += result.skipped;
  }

  console.log(
    `\nDone. ${targets.length} ${targets.length === 1 ? 'category' : 'categories'}: ` +
      `inserted ${inserted}, skipped ${skipped}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
