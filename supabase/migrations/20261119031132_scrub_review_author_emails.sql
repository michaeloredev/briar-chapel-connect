-- Remove email addresses saved as review author names.
--
-- /api/service-reviews used to fall back to the reviewer's email when their
-- Clerk account had no name or username, and service_reviews is readable by
-- anyone (the provider card reads author_name straight from it with the anon
-- key). The route now uses the same name lookup as comments, which never
-- falls back to an email. This clears any email already stored; those reviews
-- show as "Anonymous". The rating and text are untouched.

UPDATE public.service_reviews
   SET author_name = NULL
 WHERE author_name LIKE '%@%';
