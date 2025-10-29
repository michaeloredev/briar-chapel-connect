import React from 'react';

export type TagPillProps = {
  label: string;
  color?: 'slate' | 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'indigo' | 'purple' | 'pink' | 'cyan';
  className?: string;
};

const colorMap: Record<NonNullable<TagPillProps['color']>, string> = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-700/50 dark:text-blue-100',
  green: 'bg-green-100 text-green-700 dark:bg-green-700/50 dark:text-green-100',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-700/50 dark:text-amber-100',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-700/50 dark:text-rose-100',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-700/50 dark:text-violet-100',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/50 dark:text-indigo-100',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-700/50 dark:text-purple-100',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-700/50 dark:text-pink-100',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-700/50 dark:text-cyan-100',
};

export function TagPill({ label, color = 'slate', className }: TagPillProps) {
  return (
    <span className={[
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
      colorMap[color],
      className || '',
    ].join(' ')}>
      {label}
    </span>
  );
}

export default TagPill;
