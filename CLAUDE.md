# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server (Turbopack) on :3000
npm run build    # production build
npm start        # serve the production build
npx tsc --noEmit # typecheck — the only standalone check in the repo
```

There is no test suite, no linter config, and no `lint` script. `npx tsc --noEmit` plus a build is the full verification path.

`next build` writes to `.next`, which is the same directory the dev server serves from — building while `npm run dev` is running will break the live server. Next 15 has no `--distDir` build flag, so to build in isolation use a detached git worktree and hardlink the deps into it (`cp -al ../node_modules node_modules`); a *symlinked* `node_modules` makes Turbopack panic with "points out of the filesystem root".

One seed runner covers every service category. It loads env itself and is safe to re-run (a provider is skipped when the same title already exists in the category):

```bash
node --env-file=.env.local scripts/seed-providers.mjs                   # all categories
node --env-file=.env.local scripts/seed-providers.mjs cleaning-services # one
node --env-file=.env.local scripts/seed-providers.mjs --list
```

Provider data is one module per category in `scripts/providers/`, each exporting `CATEGORY` and `PROVIDERS`. Adding a category means adding a file there; the runner discovers it. It warns when a module's `CATEGORY` has no counterpart in `lib/data/services.ts`, since rows seeded under an unknown slug are invisible to every page.

## Architecture

Next.js 15 App Router, React 19, Tailwind 4. Auth is **Clerk**; data and file storage are **Supabase**. The two are bridged by a Clerk JWT template named `supabase` whose JWKS endpoint is registered with Supabase — so Postgres RLS policies authorize against the Clerk user ID via `auth.jwt() ->> 'sub'`, and every `user_id` column is a Clerk ID stored as `TEXT`, never a Supabase auth UUID.

### Four Supabase clients — picking the wrong one is the main hazard

| Module | Runs | Auth context |
|---|---|---|
| `lib/supabase/client.ts` | browser | anon key, RLS as signed-out |
| `lib/supabase/server.ts` | server | anon key; pass a Clerk token to act as the user |
| `lib/supabase/auth.ts` → `requireAuthSupabase()` | API routes | **the default for writes** — returns `{ supabase, userId }`, throws `Unauthorized` |
| `lib/supabase/admin.ts` → `createAdminClient()` | server only | service role, **bypasses RLS entirely** |

`requireAuthSupabase()` gives a client whose writes are still checked by RLS, so ownership enforces itself. `createAdminClient()` does not — anything reached through it must be authorized in application code first, normally with `requireRole()`. Routes commonly do both: authenticate with `requireAuthSupabase()`, check the role, then use the admin client for the actual write (see `app/api/providers/route.ts`).

### Roles

`lib/auth/roles.ts` defines a `superadmin > admin > client` hierarchy stored in `user_roles`; a user with no row is `client`. Server-side enforcement is `requireRole(userId, 'admin')`, which throws `Forbidden`. The client mirror is `RoleProvider` (mounted in `app/layout.tsx`, fetches `/api/me/role`) with `<RoleGate minimum="...">` for conditional UI. **`RoleGate` only hides UI** — it is not a security boundary, so every gated action needs the matching `requireRole()` on the server.

### API route conventions

Routes are thin handlers under `app/api/*/route.ts` wrapped in try/catch, returning through `lib/api/response.ts`. `apiError()` maps a thrown `Error('Unauthorized')` → 401 and `Error('Forbidden')` → 403, so route code throws rather than hand-building those responses, and leaks `debug` detail only outside production. `apiBadRequest()` is the 400. Supabase errors are logged as `[Resource][METHOD] …` before being returned.

Because `requireAuthSupabase()` and `requireRole()` signal by throwing, a handler that forgets its try/catch turns an auth failure into a 500.

### Auth routing

`middleware.ts` makes browse routes (`/`, `/services`, `/marketplace`, `/events`, `/groups`) public and protects the rest, **splitting page from API**: page requests redirect to `/sign-in` (bare `auth.protect()` would 404 a signed-out visitor onto a dead end), while `/api/*` keeps returning JSON 401. Two GET endpoints are explicitly opened for signed-out reads: `/api/comments` and `/api/me/role`. Protected sections also gate on the server — see `app/members/layout.tsx`.

### Services taxonomy

The services catalog is **static data, not database rows**: `lib/data/services.ts` declares sections and items with `slug` and a Lucide icon. Providers stored in the `services` table join to it through a composite `category` string of the form `"<section-slug>/<service-slug>"` (e.g. `home-property-services/cleaning-services`), which is what `/services/[category]/[service]` and the seed data key off. Adding a service category means editing that file *and* using its slugs in any seeded rows.

### Comments

`comments` is polymorphic over `(entity_type, entity_id)` with `parent_id` for threading, so one table backs discussion on marketplace items, events and groups. The `components/forum/*` components are correspondingly generic.

### Uploads

All three upload routes delegate to `handleFileUpload(req, bucket)` in `lib/api/upload.ts`, targeting the `comment-images`, `marketplace-images` and `provider-logos` buckets. It caps files at 2MB and **sniffs magic bytes** to determine type rather than trusting the client's MIME type, accepting only JPEG/PNG/WebP. Client-side cropping/downscaling happens before upload via `lib/images/cropImageToSquareWebp.ts`. Deleting a parent record should also clean up its stored images.

### Dates

Events use `lib/utils/date.ts` throughout. Multi-day events are expanded into local day keys by `eventDayKeys()`; calendar and list views must share it, since bucketing with raw UTC ISO strings is what previously made the two disagree across day boundaries.

## Database changes

Schema lives in `supabase/migrations/`, applied with the Supabase CLI — `npm run db:push`. The baseline `20260921002144_remote_schema.sql` was pulled from the live database and builds the whole schema from nothing; every later change is its own timestamped file from `npx supabase migration new <name>`. Never edit an applied migration, and never change the schema through the dashboard SQL editor: that is what silently drifted the old `supabase-schema.sql` away from reality.

Two things `supabase db pull` will not capture, so they have to be written by hand when they change:

- **Storage buckets** are rows in `storage.buckets`, not schema. A pull brings the policies on `storage.objects` and none of the buckets they reference.
- **Revoked privileges.** A dump records the grants that exist, not the ones deliberately taken away.

New tables need RLS enabled and policies written against `auth.jwt() ->> 'sub'` following the existing pattern.

**`user_roles` has RLS enabled and no policies, on purpose.** The anon key is public and Supabase accepts any valid Clerk JWT, so a permissive policy there lets a `client` upsert themselves `superadmin` via PostgREST and bypass every `requireRole()` check. All legitimate access uses the service-role client, which bypasses RLS anyway. Do not add a policy to that table.

More generally, RLS is the real authorization boundary for anything a browser can reach — app-level `requireRole()` only covers traffic that goes through the route. Where the two disagree, the weaker one wins.

## Conventions

- Import via the `@/*` alias rather than relative paths.
- `lib/supabase/types.ts` holds generated `Database` types; derive row shapes from it (`Database['public']['Tables']['services']['Row'|'Insert'|'Update']`) instead of redeclaring them.
- Dark mode is supported everywhere via Tailwind `dark:` variants — new UI should carry both.
