'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import RoleGate from '@/components/auth/RoleGate';

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/events', label: 'Events' },
  { href: '/groups', label: 'Groups' },
] as const;

function navLinkClass(active: boolean) {
  return active
    ? 'text-blue-600 dark:text-blue-400 font-medium'
    : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors';
}

//this is the header component for the app
export function Header() {
  const pathname = usePathname() ?? '';

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="truncate">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Briar Chapel Connect</h1>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-4">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass(isActive(link.href))}>
                  {link.label}
                </Link>
              ))}
              <RoleGate minimum="superadmin">
                <Link href="/members" className={navLinkClass(isActive('/members'))}>
                  Members
                </Link>
              </RoleGate>
            </div>
            <div className="flex gap-4 items-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    Sign In
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
