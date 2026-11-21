import Link from 'next/link';
import { ArrowUp, LifeBuoy } from 'lucide-react';

/**
 * The site footer, on every page via the root layout. "Back to top" links to
 * `#top`, which browsers scroll to the top of the page even with no element
 * of that id.
 */
export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-900 dark:text-white">Briar Chapel Connect</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">© 2026 · Made by neighbors, for neighbors.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/support"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Support
          </Link>
          <a
            href="#top"
            aria-label="Back to top"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <ArrowUp className="h-5 w-5" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
