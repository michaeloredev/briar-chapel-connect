# Setup guide

A first-time setup, start to finish. If you only want the short version, see
the quick start in [README.md](./README.md).

Five things have to be true before the app works end to end:

1. Environment variables are set.
2. Clerk has an application and API keys.
3. Supabase accepts Clerk's JWTs (the JWT template + JWKS step).
4. The database schema is applied.
5. Your own user has a `superadmin` row.

Step 3 is the one people miss. Without it every read and write fails row-level
security, which looks like empty pages and unexplained errors rather than an
auth problem.

## Prerequisites

- Node.js 18.18 or later (20 LTS recommended)
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application

```bash
npm install
```

## 1. Environment variables

Copy the template and fill it in:

```bash
cp .env.example .env.local
```

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page. Public by design; it ships to the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. **Secret — bypasses row-level security entirely** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys |
| `CLERK_SECRET_KEY` | Clerk → API Keys. **Secret** |

The `NEXT_PUBLIC_CLERK_*_URL` values in `.env.example` can stay as they are.

`.env.local` is gitignored. Never commit real keys, and never put the service
role key in a `NEXT_PUBLIC_*` variable — that would publish it to every visitor.

## 2. Clerk

1. Create an application at <https://dashboard.clerk.com>.
2. Copy the publishable key and secret key into `.env.local`.
3. Under **User & Authentication**, enable the sign-in methods you want (email
   is enough to start).

## 3. Let Supabase trust Clerk

This is what makes row-level security work. Policies authorize with
`auth.jwt() ->> 'sub'`, which is the Clerk user ID — so Supabase has to be able
to verify Clerk's tokens.

**In Clerk:**

1. Go to **JWT Templates** and create a template named exactly `supabase`.
2. Give it these claims:

   ```json
   {
     "aud": "authenticated",
     "exp": {{user.exp}},
     "sub": {{user.id}},
     "email": {{user.primary_email_address}},
     "role": "authenticated"
   }
   ```

3. Copy the template's **JWKS Endpoint** URL.

**In Supabase:**

4. Go to **Authentication** → **Providers** → **Custom**, paste the JWKS
   endpoint URL, and save.

If you later create a second Supabase project for production, repeat step 4
against that project. It is per-project, and forgetting it is the most common
cause of a new environment that looks broken.

## 4. Apply the database schema

The schema lives in `supabase/migrations/` and is applied with the Supabase
CLI. There is no SQL to paste into the dashboard.

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push
```

`link` and `db:push` need your **database password** (Supabase → Project
Settings → Database), which is separate from your dashboard login and can be
reset there safely — it does not affect the anon or service role keys.

This creates nine tables:

| Table | Holds |
|---|---|
| `services` | Service providers in the directory |
| `service_reviews` | Star ratings and reviews, one per user per provider |
| `marketplace_items` | Buy/sell listings |
| `events` | Community events |
| `event_attendees` | RSVPs (table exists; not yet wired to the UI) |
| `groups` | Neighborhood groups |
| `group_members` | Group membership |
| `comments` | Threaded discussion, polymorphic across entities |
| `user_roles` | `superadmin` / `admin` / `client` |

It also creates the three storage buckets (`comment-images`,
`marketplace-images`, `provider-logos`, each capped at 2MB), all row-level
security policies, indexes, and the timestamp and attendee-count triggers.

> Do not change the schema through the dashboard SQL editor. Use
> `npx supabase migration new <name>` and `npm run db:push`, or the migrations
> stop describing reality. See the database section of `CLAUDE.md`.

## 5. Make yourself a superadmin

A user with no row in `user_roles` is a `client` and cannot create providers,
events or groups. There is no way to grant the first superadmin through the
UI — the table is deliberately unreachable from the browser, so it has to be
done with the service role.

1. Start the app and sign up, so Clerk creates your user.
2. Find your Clerk user ID (Clerk dashboard → Users → your user, an ID like
   `user_2abc...`).
3. In the Supabase SQL editor:

   ```sql
   insert into user_roles (user_id, role)
   values ('user_YOUR_CLERK_ID', 'superadmin')
   on conflict (user_id) do update set role = excluded.role;
   ```

Once you have one superadmin, further roles can be managed in the app at
`/members`.

## 6. Run it

```bash
npm run dev
```

Open <http://localhost:3000>, sign in, and check that the header shows your
avatar and that **Members** appears in the nav (superadmin only).

## 7. Seed the provider directory (optional)

The service directory starts empty. The seed scripts add real local providers
per category, and are safe to re-run — they skip a provider whose title already
exists in that category.

```bash
node --env-file=.env.local scripts/seed-cleaning-providers.mjs
```

Each script assigns the providers it creates to the **only** superadmin in
`user_roles`, so step 5 has to be done first and there must be exactly one
superadmin at that moment.

## Troubleshooting

**Everything loads but all lists are empty, or writes fail silently.**
Step 3 is almost certainly incomplete. Row-level security is denying
everything because Supabase cannot verify the Clerk token. Check the JWT
template is named exactly `supabase` and that the JWKS URL is saved in
Supabase.

**"Forbidden" when creating a provider, event or group.**
Working as intended — providers need `superadmin`, events and groups need
`admin`. Check your row in `user_roles` (step 5).

**Uploads fail with a missing bucket error.**
The migrations were not applied, or only partly. Re-run `npm run db:push`.

**`supabase link` or `db:push` fails with a `cli_login_postgres` role error.**
The CLI's passwordless flow does not work on some older projects. Supply the
database password instead:

```bash
SUPABASE_DB_PASSWORD='...' npx supabase db push
```

**Signed-out requests to `/api/*` return an HTML 404 instead of a JSON 401.**
Known issue — `auth.protect()` in `middleware.ts` rewrites to a 404 for API
routes despite the comment there saying otherwise.

## Further reading

- [CLAUDE.md](./CLAUDE.md) — architecture, the four Supabase clients, roles,
  the services taxonomy, database workflow and conventions
- [NEXT_STEPS.md](./NEXT_STEPS.md) — roadmap and known gaps
