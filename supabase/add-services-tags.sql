-- Run once to add tag support to service providers.
-- Existing rows default to an empty array so reads never have to handle NULL.

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
