'use client';

import { Search, X } from 'lucide-react';
import * as React from 'react';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  'aria-label'?: string;
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  className = '',
  inputClassName = '',
  autoFocus,
  'aria-label': ariaLabel = 'Search',
}: SearchBarProps) {
  return (
    <form
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      role="search"
      aria-label={ariaLabel}
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClassName}`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
