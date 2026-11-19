'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import RoleGate from '@/components/auth/RoleGate';
import ThemeToggle from '@/components/theme/ThemeToggle';

const NAV_LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/groups', label: 'Groups' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/services', label: 'Services' },
] as const;

function navLinkClass(active: boolean) {
  return active
    ? 'text-blue-600 dark:text-blue-400 font-medium'
    : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors';
}

function mobileLinkClass(active: boolean) {
  return `block rounded-lg px-3 py-3 text-base ${
    active
      ? 'bg-blue-50 text-blue-700 font-medium dark:bg-slate-800 dark:text-blue-300'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
  }`;
}

export function Header() {
  const pathname = usePathname() ?? '';
  // The phone menu. Every link in it closes it, so it never lingers over the
  // page it just opened.
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

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
              {/* News is members-only, so signed-out visitors don't see the link. */}
              <SignedIn>
                <Link href="/news" className={navLinkClass(isActive('/news'))}>
                  News
                </Link>
              </SignedIn>
              <RoleGate minimum="superadmin">
                <Link href="/members" className={navLinkClass(isActive('/members'))}>
                  Members
                </Link>
              </RoleGate>
            </div>
            <div className="flex gap-4 items-center">
              <ThemeToggle />
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
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {menuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen ? (
          <div id="mobile-menu" className="md:hidden mt-3 flex flex-col gap-1 border-t border-slate-200 pt-3 dark:border-slate-700">
            <Link href="/" onClick={closeMenu} className={mobileLinkClass(pathname === '/')}>
              Home
            </Link>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeMenu} className={mobileLinkClass(isActive(link.href))}>
                {link.label}
              </Link>
            ))}
            <SignedIn>
              <Link href="/news" onClick={closeMenu} className={mobileLinkClass(isActive('/news'))}>
                News
              </Link>
            </SignedIn>
            <RoleGate minimum="superadmin">
              <Link href="/members" onClick={closeMenu} className={mobileLinkClass(isActive('/members'))}>
                Members
              </Link>
            </RoleGate>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
