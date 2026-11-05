-- Retire Supabase Storage: images now live in Cloudflare R2 (lib/api/upload.ts).
--
-- The four buckets were emptied once their images were copied to R2 and every
-- stored URL was rewritten. This drops the buckets and the storage.objects
-- policies that reference them. A database built fresh from migrations creates
-- them in earlier files and removes them here, so neither environment keeps
-- an unused upload path that a browser holding the anon key could still reach.

-- Refuse to run if any bucket still holds files: they would be lost. Empty the
-- bucket through the Storage API (or the dashboard) first.
DO $$
DECLARE
  remaining bigint;
BEGIN
  SELECT count(*) INTO remaining
    FROM storage.objects
   WHERE bucket_id IN ('comment-images', 'marketplace-images', 'group-images', 'provider-logos');
  IF remaining > 0 THEN
    RAISE EXCEPTION 'Refusing to drop storage buckets: % object(s) still stored', remaining;
  END IF;
END $$;

-- Baseline policies on comment-images and marketplace-images.
DROP POLICY IF EXISTS "Auth delete own files comment-images"     ON "storage"."objects";
DROP POLICY IF EXISTS "Auth delete own files marketplace-images" ON "storage"."objects";
DROP POLICY IF EXISTS "Auth update own files comment-images"     ON "storage"."objects";
DROP POLICY IF EXISTS "Auth update own files marketplace-images" ON "storage"."objects";
DROP POLICY IF EXISTS "Auth upload own files comment-images"     ON "storage"."objects";
DROP POLICY IF EXISTS "Auth upload own files marketplace-images" ON "storage"."objects";

-- provider-logos policies (the auth.uid() twins went in 20260921002557).
DROP POLICY IF EXISTS "Users can delete own files (external jwt)"     ON "storage"."objects";
DROP POLICY IF EXISTS "Users can update own files (external jwt)"     ON "storage"."objects";
DROP POLICY IF EXISTS "Users can upload to own folder (external jwt)" ON "storage"."objects";

-- group-images was created without policies (20261102021040).

-- Supabase guards storage tables against direct SQL deletes; this opts in for
-- this transaction only. Harmless on versions without the guard.
SET LOCAL storage.allow_delete_query = 'true';

DELETE FROM storage.buckets
 WHERE id IN ('comment-images', 'marketplace-images', 'group-images', 'provider-logos');
