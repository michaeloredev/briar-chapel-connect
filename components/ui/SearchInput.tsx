'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

type Props = {
  placeholder?: string;
  ariaLabel?: string;
  initialValue?: string;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
};

export default function SearchInput({
  placeholder = 'Search services and providers…',
  ariaLabel = 'Search services and providers',
  initialValue = '',
  onSubmit,
  onClear,
}: Props) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialValue);

  function submit() {
    const q = value.trim();
    if (!q) return;
    if (onSubmit) {
      onSubmit(q);
      return;
    }
    router.push(`/services/search?q=${encodeURIComponent(q)}`);
  }

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

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
          placeholder={placeholder}
          className="w-64 sm:w-72 lg:w-96 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={ariaLabel}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              setValue('');
              if (onClear) {
                onClear();
                return;
              }
              // Default clear: return to services landing
              if (!onSubmit) {
                router.push('/services');
              }
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
            aria-label="Clear search"
          >
            <span className="block leading-none text-[16px]">×</span>
          </button>
        ) : null}
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
 
 
