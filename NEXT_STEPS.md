# Roadmap and known gaps

What exists, what is missing, and what is known to be broken. Setup lives in
[SETUP.md](./SETUP.md); this file is only about what to build next.

Last reviewed: 2026-09-23.

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
- **RSVP is not implemented.** `event_attendees` has a table, policies and
  increment/decrement triggers, but nothing writes to it, so
  `events.current_attendees` is always 0.

## Known bugs

None outstanding. The findings from the services review have all been
fixed; anything new belongs here.

## Infrastructure

- **No production database.** One Supabase project exists and is treated as
  development. Create a separate production project **before** the first
  deploy — once real neighbors post to the current one it becomes production
  by default, and splitting afterwards means migrating live data instead of
  running the seed runner.
- **Not deployed anywhere.** No hosting configuration in the repo.
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
- [x] Input validation across all routes — rating bounds and integers,
      provider categories checked against the taxonomy, search input escaped
      before it reaches a LIKE pattern
- [ ] Rate limiting on API routes
- [ ] Content moderation beyond admin comment deletion
- [ ] Terms of service and privacy policy
- [ ] Production deployment over HTTPS with its own Supabase project

## Ideas not yet started

Direct messaging between neighbors, saved/favorited listings, user profiles,
notifications and email alerts, location-based filtering, and SEO and analytics
for launch.
