# Roadmap and known gaps

What exists, what is missing, and what is known to be broken. Setup lives in
[SETUP.md](./SETUP.md); this file is only about what to build next.

Last reviewed: 2026-09-22.

## Built

**Services** — directory driven by the static taxonomy in
`lib/data/services.ts`, browsable by section and service, with cross-category
search. Providers support logos (cropped and downscaled in the browser), tags,
contact details and star ratings. Create, edit and delete are superadmin-only.
130 providers are seeded across 22 categories.

**Marketplace** — listings with multiple images, category filter, and
owner-only delete.

**Events** — month calendar plus a day list sharing one bucketing helper.
Admins can create and edit; events can be scoped to a group.

**Groups** — list and detail pages, admin create and edit, member join/leave.

**Discussion** — one threaded `comments` table polymorphic over
`(entity_type, entity_id)`, so marketplace items, events and groups all reuse
the same components. Image attachments supported; admins can delete any
comment.

**Roles** — `superadmin > admin > client`, enforced server-side by
`requireRole()` and mirrored in the UI by `RoleGate`. Managed at `/members`.

**Theme** — light/dark toggle in the header, remembered per browser, following
the OS until the visitor chooses.

**Schema** — managed as Supabase CLI migrations in `supabase/migrations/`.

## Gaps in what is already built

These are missing pieces in shipped features, roughly in priority order.

- **Events and groups cannot be deleted.** No route exists for either, so a
  mistaken entry can only be removed from the database directly.
- **Marketplace listings cannot be edited**, only created and deleted.
- **The event detail page is a placeholder.** `app/events/[id]/page.tsx`
  renders "Scaffold placeholder" and nothing links to it. Events are the only
  major entity with no detail view — and since comments are polymorphic, that
  page is where event discussion would live.
- **RSVP is not implemented.** `event_attendees` has a table, policies and
  increment/decrement triggers, but nothing writes to it, so
  `events.current_attendees` is always 0.
- **Provider images leak.** Deleting a provider does not remove its logo from
  the `provider-logos` bucket, and replacing a logo orphans the old file.
  `removeStorageObjects()` already exists and the marketplace route uses it.
- **`PATCH /api/providers` nulls optional fields on a partial update** —
  sending only `{id, name}` blanks the provider's email, phone, location and
  website. The events and groups PATCH routes show the pattern that avoids it.

## Known bugs

- `middleware.ts` rewrites signed-out `/api/*` requests to an **HTML 404**
  rather than a JSON 401, despite the comment there stating the opposite.
  Client code that expects `{ error }` JSON gets a Next error page.
- `PATCH /api/providers` returns 500 for an unknown or malformed id; DELETE on
  the same resource correctly returns 404.
- `POST /api/providers` does not validate `category` against the taxonomy, so a
  typo creates a provider no page can ever query.
- The rating control is shown to signed-out visitors on public service pages;
  submitting surfaces a raw JSON error.
- Half stars render in the inherited slate color instead of amber, and every
  rating emits a duplicate `id="half"` gradient.
- Provider search does not escape `%` or `_`, so a query like `100%` matches
  almost everything. It also searches only `title`, not `summary`.
- `POST /api/service-reviews` accepts non-integer ratings and Postgres rounds
  them, so a crafted request can nudge an average.

## Infrastructure

- **No production database.** One Supabase project exists and is treated as
  development. Create a separate production project **before** the first
  deploy — once real neighbors post to the current one it becomes production
  by default, and splitting afterwards means migrating live data instead of
  running the seed scripts.
- **Not deployed anywhere.** No hosting configuration in the repo.
- **The 22 seed scripts share a byte-identical 60-line tail** — about 1,300
  duplicated lines. One runner plus per-category data modules would collapse
  them.
- **No tests and no linter.** `npx tsc --noEmit` plus a build is the whole
  verification path.

## Security checklist

- [x] Row-level security enabled on all nine tables
- [x] `user_roles` unreachable from the browser (RLS with no policies, plus
      revoked grants), so a client cannot promote themselves
- [x] Privileged writes enforced in the database, not only in the route —
      creating providers, events and groups requires the service role
- [x] Uploads sniff magic bytes rather than trusting the client MIME type,
      capped at 2MB in the route *and* on the bucket
- [x] Secrets kept out of `NEXT_PUBLIC_*` and out of git
- [ ] Input validation across all routes (partial — see gaps above)
- [ ] Rate limiting on API routes
- [ ] Content moderation beyond admin comment deletion
- [ ] Terms of service and privacy policy
- [ ] Production deployment over HTTPS with its own Supabase project

## Ideas not yet started

Direct messaging between neighbors, saved/favorited listings, user profiles,
notifications and email alerts, location-based filtering, and SEO and analytics
for launch.
