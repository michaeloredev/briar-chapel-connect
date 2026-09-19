-- Run once on an existing database that may have duplicate (service_id, user_id) rows.
-- Keeps the most recently updated review per user per service, then enforces uniqueness.

DELETE FROM service_reviews sr
WHERE sr.ctid NOT IN (
  SELECT DISTINCT ON (service_id, user_id) ctid
  FROM service_reviews
  ORDER BY service_id, user_id, updated_at DESC NULLS LAST, created_at DESC
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_reviews_service_id_user_id ON service_reviews(service_id, user_id);
