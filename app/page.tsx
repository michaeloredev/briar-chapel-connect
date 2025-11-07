import { GridCard } from '@/components/ui/GridCard';
import { Briefcase, ShoppingCart, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Your Neighborhood,
            <br />
            <span className="text-blue-600 dark:text-blue-400">All In One Place</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Discover local services, buy and sell with neighbors, and stay connected with community events in Briar Chapel.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <Link href="/services" className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
            <GridCard
              icon={Briefcase}
              title="Local Services"
              description="Find trusted plumbers, electricians, tutors, cleaners, and more—all from your neighborhood."
              colorClasses={{
                bg: 'bg-blue-100 dark:bg-blue-900',
                icon: 'text-blue-600 dark:text-blue-400'
              }}
            />
          </Link>

          <Link href="/marketplace" className="block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl">
            <GridCard
              icon={ShoppingCart}
              title="Marketplace"
              description="Buy and sell items with neighbors. From furniture to electronics, find great deals locally."
              colorClasses={{
                bg: 'bg-emerald-100 dark:bg-emerald-900',
                icon: 'text-emerald-600 dark:text-emerald-400'
              }}
            />
          </Link>

          <Link href="/events" className="block focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-xl">
            <GridCard
              icon={Calendar}
              title="Community Events"
              description="Discover yard sales, block parties, meetups, and local happenings. Stay connected with your community."
              colorClasses={{
                bg: 'bg-purple-100 dark:bg-purple-900',
                icon: 'text-purple-600 dark:text-purple-400'
              }}
            />
          </Link>

          <Link href="/groups" className="block focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-xl">
            <GridCard
              icon={Users}
              title="Groups & Clubs"
              description="Join clubs, teams, hobby groups, and social circles. Connect with neighbors who share your interests."
              colorClasses={{
                bg: 'bg-orange-100 dark:bg-orange-900',
                icon: 'text-orange-600 dark:text-orange-400'
              }}
            />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-600 dark:text-slate-400">
            © 2025 Briar Chapel Connect.
          </p>
        </div>
      </footer>
    </div>
  );
}
