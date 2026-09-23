# Briar Chapel Connect

A neighborhood hub for the Briar Chapel community: a directory of local service
providers, a marketplace for buying and selling with neighbors, a community
events calendar, and neighborhood groups — with threaded discussion on all of
them.

## Tech stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) with React 19 |
| Styling | Tailwind CSS 4, dark mode throughout |
| Auth | Clerk |
| Database & storage | Supabase (Postgres + Storage) |
| Icons | lucide-react |

Clerk and Supabase are bridged by a Clerk JWT template named `supabase`, so
Postgres row-level security authorizes against the Clerk user ID. Every
`user_id` column holds a Clerk ID as `TEXT`, never a Supabase auth UUID.

## Getting started

### Prerequisites

- Node.js 18.18 or later (20 LTS recommended)
- A Supabase project
- A Clerk application

### Quick start

```bash
npm install
cp .env.example .env.local     # then fill in your keys
npm run db:push                # applies supabase/migrations to your database
npm run dev
```

Then open <http://localhost:3000>.

`npm run db:push` needs the Supabase CLI linked to your project
(`npx supabase link --project-ref <ref>`). Authentication will not work until
the Clerk JWT template is registered with Supabase, and no one can manage
content until a first superadmin row exists.

**Both of those steps, and the rest of the walkthrough, are in
[SETUP.md](./SETUP.md).** Start there for a first-time setup.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (Turbopack) on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npx tsc --noEmit` | Typecheck — the only standalone check in the repo |
| `npm run db:push` | Apply pending migrations to the linked database |
| `npm run db:pull` | Write the linked database's schema to a new migration |
| `npm run db:diff` | Show the difference between migrations and the database |

There is no test suite and no linter config. `npx tsc --noEmit` plus a build is
the full verification path.

> `next build` writes to `.next`, the same directory `npm run dev` serves from,
> so building while the dev server runs will break it.

## Project structure

```
briar-chapel-connect/
├── app/
│   ├── api/                  # Route handlers (providers, events, groups,
│   │                         #   marketplace, comments, reviews, uploads, admin)
│   ├── services/             # Provider directory, by category and service
│   ├── marketplace/          # Listings
│   ├── events/               # Calendar and day list
│   ├── groups/               # Groups and group detail
│   ├── members/              # Member admin (role-gated)
│   ├── sign-in/, sign-up/    # Clerk catch-all routes
│   ├── layout.tsx            # Providers, header, theme no-flash script
│   └── globals.css           # Tailwind entry and theme tokens
├── components/
│   ├── auth/                 # RoleProvider, RoleGate
│   ├── common/               # App-specific composites (breadcrumbs, page header)
│   ├── ui/                   # Generic primitives (cards, search, star rating)
│   ├── layout/               # Header
│   ├── theme/                # Light/dark toggle and provider
│   ├── forum/                # Generic comment thread, reused by every entity
│   └── events/, groups/, marketplace/, services/
├── lib/
│   ├── supabase/             # Four clients + generated Database types
│   ├── auth/roles.ts         # superadmin > admin > client, requireRole()
│   ├── api/                  # Shared response helpers and upload handling
│   ├── data/                 # Static taxonomies (services, categories, types)
│   ├── images/               # Client-side crop/downscale before upload
│   └── utils/date.ts         # All event date handling
├── scripts/                  # One-off provider seed scripts
├── supabase/migrations/      # Schema, applied with the Supabase CLI
├── middleware.ts             # Clerk route protection
├── SETUP.md                  # First-time setup walkthrough
├── NEXT_STEPS.md             # Roadmap and known gaps
└── CLAUDE.md                 # Architecture notes and conventions
```

`CLAUDE.md` is the most detailed description of how the pieces fit together —
the Supabase client split, the role system, the services taxonomy and the
database workflow. It is worth reading before making changes, whether or not
you use Claude Code.

## Deployment

Not yet deployed. When you do deploy, create a **separate** Supabase project
for production rather than pointing at your development database, and apply the
schema to it with `npm run db:push`. See the deployment section of
[NEXT_STEPS.md](./NEXT_STEPS.md).

## License

Private project. All rights reserved.
