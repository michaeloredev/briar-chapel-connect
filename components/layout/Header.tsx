import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="truncate">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Briar Chapel Connect</h1>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-4">
              <Link href="/services" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Services
              </Link>
              <Link href="/marketplace" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Marketplace
              </Link>
              <Link href="/events" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Events
              </Link>
              <Link href="/groups" className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Groups
              </Link>
            </div>
            <div className="flex gap-4 items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    Get Started
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
