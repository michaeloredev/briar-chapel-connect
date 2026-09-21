# Briar Chapel Connect

A modern neighborhood hub built with Next.js 15.5.6, connecting neighbors through local services, marketplace, and community events.

## Features

- **Local Services** - Find trusted neighborhood service providers (plumbers, electricians, tutors, cleaners)
- **Marketplace** - Buy and sell items with neighbors
- **Community Events** - Discover yard sales, block parties, meetups, and local happenings
- **Authentication** - Secure user accounts with Clerk
- **Modern UI** - Beautiful, responsive design with dark mode support
- **Real-time Updates** - Powered by Supabase
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Utility-first styling for rapid development

## Tech Stack

- **Framework:** Next.js 15.5.6 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Runtime:** React 19.1.0
- **Build Tool:** Turbopack (Next.js native)
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Supabase account (database already created)
- Clerk account (for authentication)

### Quick Start

1. **Set up environment variables**
   - Create `.env.local` file in the root directory
   - Add your Supabase credentials (already configured)
   - Add your Clerk API keys (see SETUP.md for details)

2. **Set up the database**
   - Go to your Supabase SQL Editor
   - Apply the schema with `npm run db:push`

3. **Configure Clerk**
   - Create a Clerk account at https://dashboard.clerk.com
   - Get your API keys and add them to `.env.local`

4. **Run the development server**
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

📖 **For detailed setup instructions, see [SETUP.md](./SETUP.md)**

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Create production build
- `npm start` - Start production server

## Project Structure

```
briar-chapel-connect/
├── app/
│   ├── layout.tsx              # Root layout with Clerk provider
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── lib/
│   └── supabase/
│       ├── client.ts           # Client-side Supabase client
│       ├── server.ts           # Server-side Supabase client
│       └── types.ts            # Database type definitions
├── middleware.ts               # Clerk authentication middleware
├── public/                     # Static assets
├── supabase/migrations/       # Database schema (Supabase CLI)
├── SETUP.md                    # Detailed setup instructions
├── package.json                # Dependencies and scripts
└── README.md                   # Project documentation
```

## Development

The application uses the Next.js App Router for routing and server components. Edit `app/page.tsx` to modify the home page, and changes will hot-reload automatically.

## Deployment

The app can be deployed to:
- **Vercel** (recommended) - Zero configuration deployment
- **Any Node.js hosting** - Supports standard Node.js environments
- **Docker** - Containerized deployment
- **Static export** - For static hosting (if applicable)

## License

Private - Briar Chapel Connect © 2025
