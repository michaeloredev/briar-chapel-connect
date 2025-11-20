'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = React.useState('');

  function submit() {
    const q = value.trim();
    if (!q) return;
    const url = `/services/search?q=${encodeURIComponent(q)}`;
    router.push(url);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Search services and providers…"
          className="w-64 sm:w-72 lg:w-96 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Search services and providers"
        />
        <button
          type="button"
          onClick={submit}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label="Search"
        >
          <Search className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}


