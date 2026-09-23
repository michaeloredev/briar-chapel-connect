'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

/**
 * The track, knob and icons are positioned with `dark:` variants rather than
 * from React state. The inline script in app/layout.tsx sets the class before
 * first paint, so the switch renders in the right position on the very first
 * frame instead of snapping across once hydration catches up.
 */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, ready, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={ready ? theme === 'dark' : false}
      aria-label="Dark mode"
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 border-slate-300 bg-slate-200 hover:bg-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 ${className}`}
    >
      <Sun
        aria-hidden="true"
        className="pointer-events-none absolute left-1.5 h-4 w-4 text-amber-500 opacity-100 transition-opacity dark:opacity-40"
      />
      <Moon
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 h-4 w-4 text-slate-400 opacity-40 transition-opacity dark:text-blue-300 dark:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none z-10 ml-1 h-6 w-6 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 dark:translate-x-6 dark:bg-slate-900 dark:ring-white/10"
      />
    </button>
  );
}
