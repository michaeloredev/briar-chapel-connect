-- Brirar Chapel Connect Database Schema
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Services Table (for local service providers)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    title TEXT NOT NULL,
    summary TEXT,              -- short summary shown in lists
    details TEXT,              -- longer description for detail views
    category TEXT NOT NULL,
    price_range TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    location TEXT,
    website TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    image_url TEXT
);

-- Marketplace Items Table (for buying/selling)
CREATE TABLE IF NOT EXISTS marketplace_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    location TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
    images TEXT[] DEFAULT '{}'
);

-- Optional contact field for buyer outreach (email or phone)
ALTER TABLE IF EXISTS marketplace_items
  ADD COLUMN IF NOT EXISTS contact TEXT;

-- Events Table (for community events)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    location TEXT NOT NULL,
    address TEXT,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    image_url TEXT
);

-- Event Attendees Table (for tracking who's attending events)
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    status TEXT DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
    UNIQUE(event_id, user_id)
);

-- Service Reviews Table (ratings and text reviews for services)
CREATE TABLE IF NOT EXISTS service_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    author_name TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location);

CREATE INDEX IF NOT EXISTS idx_marketplace_user_id ON marketplace_items(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_location ON marketplace_items(location);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_user_id ON service_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_rating ON service_reviews(rating);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_items_updated_at BEFORE UPDATE ON marketplace_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_reviews_updated_at BEFORE UPDATE ON service_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL, -- group category/type
    location TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_groups_user_id ON groups(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active groups" ON groups
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert their own groups" ON groups
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own groups" ON groups
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own groups" ON groups
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;

-- Services Policies
CREATE POLICY "Anyone can view active services" ON services
    FOR SELECT USING (status = 'active');

CREATE POLICY "Users can insert their own services" ON services
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own services" ON services
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own services" ON services
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Marketplace Policies
CREATE POLICY "Anyone can view available marketplace items" ON marketplace_items
    FOR SELECT USING (status = 'available' OR auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own marketplace items" ON marketplace_items
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own marketplace items" ON marketplace_items
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own marketplace items" ON marketplace_items
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Events Policies
CREATE POLICY "Anyone can view upcoming events" ON events
    FOR SELECT USING (status IN ('upcoming', 'ongoing'));

CREATE POLICY "Users can insert their own events" ON events
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Event Attendees Policies
CREATE POLICY "Anyone can view event attendees" ON event_attendees
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own attendance" ON event_attendees
    FOR ALL USING (auth.jwt() ->> 'sub' = user_id);

-- Service Reviews Policies
CREATE POLICY "Anyone can view service reviews" ON service_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON service_reviews
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own reviews" ON service_reviews
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own reviews" ON service_reviews
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Function to increment current_attendees when someone joins
CREATE OR REPLACE FUNCTION increment_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'attending' THEN
        UPDATE events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to decrement current_attendees when someone leaves
CREATE OR REPLACE FUNCTION decrement_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'attending' THEN
        UPDATE events SET current_attendees = current_attendees - 1 WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Triggers for attendee count management
CREATE TRIGGER increment_attendees AFTER INSERT ON event_attendees
    FOR EACH ROW EXECUTE FUNCTION increment_event_attendees();

CREATE TRIGGER decrement_attendees AFTER DELETE ON event_attendees
    FOR EACH ROW EXECUTE FUNCTION decrement_event_attendees();

-- Comments (generic, reusable across entities)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    entity_type TEXT NOT NULL, -- e.g., marketplace_item, service, event
    entity_id TEXT NOT NULL, -- string to support UUIDs or other ids
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON comments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Storage: comment images bucket and policies
insert into storage.buckets (id, name, public)
values ('comment-images', 'comment-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Public read comment-images'
  ) then
    create policy "Public read comment-images"
    on storage.objects for select to public
    using (bucket_id = 'comment-images');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Auth upload own files comment-images'
  ) then
    create policy "Auth upload own files comment-images"
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'comment-images'
      and auth.uid() is not null
      and name like (auth.uid()::text || '/%')
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Auth update own files comment-images'
  ) then
    create policy "Auth update own files comment-images"
    on storage.objects for update to authenticated
    using (bucket_id = 'comment-images' and name like (auth.uid()::text || '/%'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='Auth delete own files comment-images'
  ) then
    create policy "Auth delete own files comment-images"
    on storage.objects for delete to authenticated
    using (bucket_id = 'comment-images' and name like (auth.uid()::text || '/%'));
  end if;
end $$;

