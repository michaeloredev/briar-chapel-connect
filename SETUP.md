# Brirar Chapel Connect - Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (already created)
- Clerk account (needs to be created)

## 1. Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://utmmtfxjnkwwaxvtzkjg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW10Znhqbmt3d2F4dnR6a2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTU5MTEsImV4cCI6MjA3Njc5MTkxMX0.upzxy11vlmS51RDF0TU1VPR_U9mSNEzZaBS64w-U7ww

# Clerk Configuration (Need to get these)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## 2. Set Up Clerk Authentication

### Step 1: Create a Clerk Account
1. Go to [https://dashboard.clerk.com/sign-up](https://dashboard.clerk.com/sign-up)
2. Sign up for a free account
3. Create a new application

### Step 2: Get Your Clerk Keys
1. In your Clerk dashboard, go to **API Keys**
2. Copy the **Publishable Key** and paste it into `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy the **Secret Key** and paste it into `CLERK_SECRET_KEY`

### Step 3: Configure Clerk Settings (Optional but Recommended)
1. Go to **User & Authentication** → **Email, Phone, Username**
2. Enable the authentication methods you want (email is recommended)
3. Go to **User & Authentication** → **Social Connections** to enable Google, Facebook, etc.

## 3. Set Up Supabase Database

### Step 1: Run the Database Schema
1. Go to your Supabase dashboard: [https://app.supabase.com](https://app.supabase.com)
2. Select your project (utmmtfxjnkwwaxvtzkjg)
3. Navigate to **SQL Editor** in the left sidebar
4. Create a new query
5. Copy the contents of `supabase-schema.sql` file
6. Paste it into the SQL Editor
7. Click **Run** to execute the schema

This will create:
- `services` table for local service providers
- `marketplace_items` table for buying/selling
- `events` table for community events
- `event_attendees` table for event RSVPs
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

### Step 2: Configure Supabase Authentication with Clerk

Since we're using Clerk for authentication, we need to configure Supabase to accept Clerk JWTs:

1. In Clerk dashboard, go to **JWT Templates**
2. Create a new template named "supabase"
3. Add the following claims:
```json
{
  "aud": "authenticated",
  "exp": {{user.exp}},
  "sub": {{user.id}},
  "email": {{user.primary_email_address}},
  "role": "authenticated"
}
```
4. Copy the JWKS Endpoint URL from Clerk

5. In Supabase dashboard:
   - Go to **Authentication** → **Providers**
   - Scroll to **Custom** section
   - Paste the Clerk JWKS Endpoint URL
   - Save changes

## 4. Install Dependencies

All dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

## 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 6. Test the Integration

1. Click "Get Started" or "Sign In" in the header
2. Create a new account through Clerk's modal
3. You should be signed in and see the UserButton in the header

## Database Schema Overview

### Services Table
- Local service providers (plumbers, electricians, tutors, etc.)
- Fields: title, description, category, price_range, contact info, location

### Marketplace Items Table
- Items for sale in the neighborhood
- Fields: title, description, category, price, condition, location, images

### Events Table
- Community events (yard sales, block parties, meetups)
- Fields: title, description, category, event_date, location, max_attendees

### Event Attendees Table
- Tracks RSVPs for events
- Links users to events with attendance status

## Next Steps

After setup, you can:
1. Create pages for browsing services, marketplace items, and events
2. Add forms for creating new listings
3. Implement search and filtering
4. Add image upload functionality using Supabase Storage
5. Create user profile pages
6. Add messaging between users

## Useful Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js 15 Documentation](https://nextjs.org/docs)

## Troubleshooting

### Clerk not working?
- Make sure all environment variables are set correctly in `.env.local`
- Restart the dev server after adding environment variables

### Supabase connection issues?
- Verify your Supabase URL and anon key are correct
- Check that the database schema was executed successfully

### Authentication errors?
- Ensure Clerk JWT template is configured correctly
- Verify JWKS endpoint is added to Supabase

