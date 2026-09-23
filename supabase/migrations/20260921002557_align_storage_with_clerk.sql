-- Align storage with how this app actually authenticates and uploads.
--
-- 1. provider-logos carries three pairs of policies: one written against
--    auth.uid() and one against auth.jwt() ->> 'sub'. Auth is Clerk, so
--    auth.uid() is NULL on every request and the first of each pair can never
--    match. They are dead weight that reads as if provider-logos were
--    protected differently from the other buckets. Drop them; the
--    "(external jwt)" policies are the ones doing the work.
--
-- 2. Bucket size limits are the only server-side cap. lib/api/upload.ts
--    enforces 2MB, but a signed-in user holding the anon key can upload
--    straight to their own folder through storage and never touch the route,
--    so the limit belongs on the bucket too. provider-logos was set to 1MiB,
--    which rejected files the app had already accepted; the other two had no
--    limit at all.

DROP POLICY IF EXISTS "Users can upload to own folder" ON "storage"."objects";
DROP POLICY IF EXISTS "Users can update own files"     ON "storage"."objects";
DROP POLICY IF EXISTS "Users can delete own files"     ON "storage"."objects";

UPDATE storage.buckets
   SET file_size_limit = 2097152  -- 2MB, matches MAX_UPLOAD_BYTES in lib/api/upload.ts
 WHERE id IN ('comment-images', 'marketplace-images', 'provider-logos');
