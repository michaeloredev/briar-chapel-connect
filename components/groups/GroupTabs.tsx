import Link from 'next/link';
import { BarChart3, ClipboardList, MessageSquare, type LucideIcon } from 'lucide-react';

export type GroupTab = 'discussion' | 'polls' | 'signups';

export const GROUP_TABS: Array<{ value: GroupTab; label: string; icon: LucideIcon }> = [
  { value: 'discussion', label: 'Discussion', icon: MessageSquare },
  { value: 'polls', label: 'Polls', icon: BarChart3 },
  { value: 'signups', label: 'Sign-ups', icon: ClipboardList },
];

/** Tab bar for a group page. Tabs are links (?tab=), so each is server-rendered and shareable. */
export default function GroupTabs({
  groupId,
  active,
  counts,
}: {
  groupId: string;
  active: GroupTab;
  counts: Partial<Record<GroupTab, number>>;
}) {
  return (
    // No overflow scrolling here: the tabs' -mb-px overlap (which lays the
    // active underline over the border) would make it show a scrollbar.
    // Three tabs fit at phone width; flex-wrap covers anything narrower.
    <nav aria-label="Group sections" className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700">
      {GROUP_TABS.map(({ value, label, icon: Icon }) => {
        const isActive = value === active;
        const count = counts[value];
        return (
          <Link
            key={value}
            href={value === 'discussion' ? `/groups/${groupId}` : `/groups/${groupId}?tab=${value}`}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={[
              '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors sm:px-4',
              isActive
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {count ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
