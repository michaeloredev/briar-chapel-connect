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
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price_range TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    location TEXT NOT NULL,
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

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

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

