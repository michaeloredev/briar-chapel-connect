SET local check_function_bodies = off;

-- Every table below defaults its primary key to extensions.uuid_generate_v4().
-- Supabase installs uuid-ossp on new projects, but this migration must be able
-- to build the schema from nothing, so require it explicitly rather than
-- inheriting it.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TABLE "public"."comments" (
  "id"          uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "user_id"     text                     NOT NULL,
  "entity_type" text                     NOT NULL,
  "entity_id"   text                     NOT NULL,
  "parent_id"   uuid,
  "content"     text                     NOT NULL,
  "images"      text[]                   DEFAULT '{}'::text[],
  CONSTRAINT "comments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."comments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."event_attendees" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "event_id"   uuid                     NOT NULL,
  "user_id"    text                     NOT NULL,
  "status"     text                     DEFAULT 'attending'::text,
  CONSTRAINT "event_attendees_event_id_user_id_key" UNIQUE (event_id, user_id),
  CONSTRAINT "event_attendees_pkey" PRIMARY KEY (id),
  CONSTRAINT "event_attendees_status_check" CHECK ((status = ANY (ARRAY['attending'::text, 'maybe'::text, 'not_attending'::text])))
);

ALTER TABLE "public"."event_attendees"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."events" (
  "id"                uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "user_id"           text                     NOT NULL,
  "title"             text                     NOT NULL,
  "description"       text                     NOT NULL,
  "category"          text                     NOT NULL,
  "event_date"        timestamp with time zone NOT NULL,
  "end_date"          timestamp with time zone,
  "location"          text                     NOT NULL,
  "address"           text,
  "max_attendees"     integer,
  "current_attendees" integer                  DEFAULT 0,
  "status"            text                     DEFAULT 'upcoming'::text,
  "image_url"         text,
  "group_id"          uuid,
  CONSTRAINT "events_pkey" PRIMARY KEY (id),
  CONSTRAINT "events_status_check" CHECK ((status = ANY (ARRAY['upcoming'::text, 'ongoing'::text, 'completed'::text, 'cancelled'::text])))
);

ALTER TABLE "public"."events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."group_members" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "group_id"   uuid                     NOT NULL,
  "user_id"    text                     NOT NULL,
  "role"       text                     NOT NULL DEFAULT 'member'::text,
  "status"     text                     NOT NULL DEFAULT 'active'::text,
  CONSTRAINT "group_members_pkey" PRIMARY KEY (id),
  CONSTRAINT "group_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]))),
  CONSTRAINT "group_members_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

ALTER TABLE "public"."group_members"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."groups" (
  "id"          uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "user_id"     text                     NOT NULL,
  "title"       text                     NOT NULL,
  "description" text                     NOT NULL,
  "type"        text                     NOT NULL,
  "location"    text,
  "status"      text                     DEFAULT 'active'::text,
  "image_url"   text,
  CONSTRAINT "groups_pkey" PRIMARY KEY (id),
  CONSTRAINT "groups_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

ALTER TABLE "public"."groups"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."marketplace_items" (
  "id"          uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "user_id"     text                     NOT NULL,
  "title"       text                     NOT NULL,
  "description" text                     NOT NULL,
  "category"    text                     NOT NULL,
  "price"       numeric(10,2)            NOT NULL,
  "condition"   text                     NOT NULL,
  "location"    text                     NOT NULL,
  "status"      text                     DEFAULT 'available'::text,
  "images"      text[]                   DEFAULT '{}'::text[],
  "contact"     text,
  CONSTRAINT "marketplace_items_category_check"
    CHECK
    ((category = ANY (ARRAY['furniture'::text, 'electronics'::text, 'appliances'::text, 'home_garden'::text, 'clothing'::text, 'kids'::text, 'toys_games'::text,
    'sports_outdoors'::text, 'tools'::text, 'vehicles'::text, 'pets'::text, 'free'::text, 'general'::text]))),
  CONSTRAINT "marketplace_items_condition_check" CHECK ((condition = ANY (ARRAY['new'::text, 'like_new'::text, 'good'::text, 'fair'::text, 'poor'::text]))),
  CONSTRAINT "marketplace_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "marketplace_items_status_check" CHECK ((status = ANY (ARRAY['available'::text, 'pending'::text, 'sold'::text])))
);

ALTER TABLE "public"."marketplace_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."service_reviews" (
  "id"          uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "service_id"  uuid                     NOT NULL,
  "user_id"     text                     NOT NULL,
  "rating"      integer                  NOT NULL,
  "comment"     text,
  "author_name" text,
  CONSTRAINT "service_reviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "service_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))
);

ALTER TABLE "public"."service_reviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."services" (
  "id"            uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at"    timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "user_id"       text                     NOT NULL,
  "title"         text                     NOT NULL,
  "category"      text                     NOT NULL,
  "contact_email" text,
  "contact_phone" text,
  "location"      text,
  "status"        text                     DEFAULT 'active'::text,
  "image_url"     text,
  "summary"       text,
  "details"       text,
  "website"       text,
  "tags"          text[]                   NOT NULL DEFAULT '{}'::text[],
  CONSTRAINT "services_pkey" PRIMARY KEY (id),
  CONSTRAINT "services_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);

ALTER TABLE "public"."services"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_roles" (
  "id"         uuid                     NOT NULL DEFAULT extensions.uuid_generate_v4(),
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "user_id"    text                     NOT NULL,
  "role"       text                     NOT NULL DEFAULT 'client'::text,
  CONSTRAINT "user_roles_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_roles_role_check" CHECK ((role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'client'::text]))),
  CONSTRAINT "user_roles_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."user_roles"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.decrement_event_attendees()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    IF OLD.status = 'attending' THEN
        UPDATE events SET current_attendees = current_attendees - 1 WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_event_attendees()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    IF NEW.status = 'attending' THEN
        UPDATE events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

ALTER TABLE "public"."comments"
  ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE "public"."event_attendees"
  ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE "public"."group_members"
  ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE "public"."service_reviews"
  ADD CONSTRAINT "service_reviews_service_id_fkey" FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

CREATE INDEX idx_comments_entity ON public.comments USING btree (entity_type, entity_id);

CREATE INDEX idx_comments_parent ON public.comments USING btree (parent_id);

CREATE INDEX idx_comments_user ON public.comments USING btree (user_id);

CREATE INDEX idx_event_attendees_event_id ON public.event_attendees USING btree (event_id);

CREATE INDEX idx_event_attendees_user_id ON public.event_attendees USING btree (user_id);

CREATE INDEX idx_events_category ON public.events USING btree (category);

CREATE INDEX idx_events_date ON public.events USING btree (event_date);

CREATE INDEX idx_events_group_id ON public.events USING btree (group_id);

CREATE INDEX idx_events_location ON public.events USING btree (location);

CREATE INDEX idx_events_status ON public.events USING btree (status);

CREATE INDEX idx_events_user_id ON public.events USING btree (user_id);

CREATE INDEX idx_group_members_group_id ON public.group_members USING btree (group_id);

CREATE INDEX idx_group_members_user_id ON public.group_members USING btree (user_id);

CREATE INDEX idx_groups_status ON public.groups USING btree (status);

CREATE INDEX idx_groups_type ON public.groups USING btree (TYPE);

CREATE INDEX idx_groups_user_id ON public.groups USING btree (user_id);

CREATE INDEX idx_marketplace_category ON public.marketplace_items USING btree (category);

CREATE INDEX idx_marketplace_location ON public.marketplace_items USING btree (location);

CREATE INDEX idx_marketplace_status ON public.marketplace_items USING btree (status);

CREATE INDEX idx_marketplace_user_id ON public.marketplace_items USING btree (user_id);

CREATE INDEX idx_service_reviews_rating ON public.service_reviews USING btree (rating);

CREATE UNIQUE INDEX idx_service_reviews_service_id_user_id ON public.service_reviews USING btree (service_id, user_id);

CREATE INDEX idx_service_reviews_service_id ON public.service_reviews USING btree (service_id);

CREATE INDEX idx_service_reviews_user_id ON public.service_reviews USING btree (user_id);

CREATE INDEX idx_services_category ON public.services USING btree (category);

CREATE INDEX idx_services_location ON public.services USING btree (location);

CREATE INDEX idx_services_status ON public.services USING btree (status);

CREATE INDEX idx_services_user_id ON public.services USING btree (user_id);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER decrement_attendees
  AFTER DELETE ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_event_attendees();

CREATE TRIGGER increment_attendees
  AFTER INSERT ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_event_attendees();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_items_updated_at
  BEFORE UPDATE ON public.marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_reviews_updated_at
  BEFORE UPDATE ON public.service_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone can view comments" ON "public"."comments"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can delete own comments" ON "public"."comments"
  FOR DELETE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can insert own comments" ON "public"."comments"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can update own comments" ON "public"."comments"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Anyone can view event attendees" ON "public"."event_attendees"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can manage their own attendance" ON "public"."event_attendees"
  FOR ALL
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Anyone can view upcoming events" ON "public"."events"
  FOR SELECT
  TO PUBLIC
  USING ((status = ANY (ARRAY['upcoming'::text, 'ongoing'::text])));

CREATE POLICY "Users can delete their own events" ON "public"."events"
  FOR DELETE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can insert their own events" ON "public"."events"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can update their own events" ON "public"."events"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Members can view own memberships" ON "public"."group_members"
  FOR SELECT
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can join groups (insert own membership)" ON "public"."group_members"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can leave groups (delete own membership)" ON "public"."group_members"
  FOR DELETE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Anyone can view active groups" ON "public"."groups"
  FOR SELECT
  TO PUBLIC
  USING ((status = 'active'::text));

CREATE POLICY "Users can delete their own groups" ON "public"."groups"
  FOR DELETE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can insert their own groups" ON "public"."groups"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can update their own groups" ON "public"."groups"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Anyone can view available marketplace items" ON "public"."marketplace_items"
  FOR SELECT
  TO PUBLIC
  USING (((status = 'available'::text) OR ((auth.jwt() ->> 'sub'::text) = user_id)));

CREATE POLICY "Users can delete their own marketplace items" ON "public"."marketplace_items"
  FOR DELETE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can insert their own marketplace items" ON "public"."marketplace_items"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can update their own marketplace items" ON "public"."marketplace_items"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Anyone can view service reviews" ON "public"."service_reviews"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can delete their own reviews" ON "public"."service_reviews"
  FOR DELETE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can insert their own reviews" ON "public"."service_reviews"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can update their own reviews" ON "public"."service_reviews"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Anyone can view active services" ON "public"."services"
  FOR SELECT
  TO PUBLIC
  USING ((status = 'active'::text));

CREATE POLICY "Users can delete their own services" ON "public"."services"
  FOR DELETE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can insert their own services" ON "public"."services"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Users can update their own services" ON "public"."services"
  FOR UPDATE
  TO PUBLIC
  USING (((auth.jwt() ->> 'sub'::text) = user_id));

CREATE POLICY "Auth delete own files comment-images" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'comment-images'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "Auth delete own files marketplace-images" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'marketplace-images'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "Auth update own files comment-images" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'comment-images'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "Auth update own files marketplace-images" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'marketplace-images'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "Auth upload own files comment-images" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'comment-images'::text) AND (auth.uid() IS NOT NULL) AND (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "Auth upload own files marketplace-images" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'marketplace-images'::text) AND (auth.uid() IS NOT NULL) AND (name ~~ ((auth.uid())::text || '/%'::text))));

CREATE POLICY "Users can delete own files (external jwt)" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'provider-logos'::text) AND ((auth.jwt() ->> 'sub'::text) = split_part(name, '/'::text, 1))));

CREATE POLICY "Users can delete own files" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'provider-logos'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));

CREATE POLICY "Users can update own files (external jwt)" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'provider-logos'::text) AND ((auth.jwt() ->> 'sub'::text) = split_part(name, '/'::text, 1))));

CREATE POLICY "Users can update own files" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'provider-logos'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));

CREATE POLICY "Users can upload to own folder (external jwt)" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'provider-logos'::text) AND ((auth.jwt() ->> 'sub'::text) = split_part(name, '/'::text, 1))));

CREATE POLICY "Users can upload to own folder" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'provider-logos'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));

GRANT EXECUTE ON FUNCTION "public"."decrement_event_attendees"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."increment_event_attendees"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."update_updated_at_column"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."comments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."event_attendees" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."events" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."group_members" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."groups" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."marketplace_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."service_reviews" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."services" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_roles" TO "postgres", "service_role";

-- Storage buckets. These are rows in storage.buckets, so `supabase db pull`
-- does not capture them even though the policies above reference them. Without
-- these inserts a fresh project gets the policies and no buckets, and every
-- upload in lib/api/upload.ts fails.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('comment-images',     'comment-images',     true, NULL),
  ('marketplace-images', 'marketplace-images', true, NULL),
  ('provider-logos',     'provider-logos',     true, 1048576)
ON CONFLICT (id) DO UPDATE
  SET public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- user_roles is reachable only through the service role. RLS is enabled with
-- zero policies on purpose (see CLAUDE.md), and this REVOKE is the second line
-- of defence: Supabase's default privileges grant anon/authenticated on new
-- public tables, so a policy added here by mistake would otherwise be live
-- immediately.
REVOKE ALL ON TABLE "public"."user_roles" FROM "anon", "authenticated";
