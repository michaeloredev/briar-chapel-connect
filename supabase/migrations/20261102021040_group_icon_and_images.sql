-- Let a group show a chosen icon or its own picture.
--
-- `icon` is a key from lib/data/group-icons.ts; NULL keeps the icon of the
-- group's type, so existing groups look the same until someone picks one.
-- `image_url` already exists and wins over the icon when set.

ALTER TABLE "public"."groups" ADD COLUMN "icon" text;

-- Group pictures get their own bucket. Unlike the three older buckets it has
-- no storage.objects write policies at all: the only writer is
-- /api/uploads/group-image, which checks the caller is an admin and then
-- uploads with the service role. Without policies a signed-in browser holding
-- the anon key cannot upload here directly. Public read needs no policy on a
-- public bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'group-images',
  'group-images',
  true,
  2097152,  -- 2MB, matches MAX_UPLOAD_BYTES in lib/api/upload.ts
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
