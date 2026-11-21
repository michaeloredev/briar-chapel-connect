export type EventCategory = {
  value: string;
  label: string;
  /** The category pill: slate background, like the icon tiles, with text and
   *  border (`border-current`) in the category color. Matches GroupTypePill. */
  badgeClasses: string;
  dotClasses: string;
  /** The date tile on event cards. */
  tileClasses: string;
};

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    value: 'yard_sale',
    label: 'Yard Sale',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-amber-600 dark:bg-slate-600 dark:text-amber-400',
    dotClasses: 'bg-amber-500',
    tileClasses: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  {
    value: 'group',
    label: 'Group',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-orange-600 dark:bg-slate-600 dark:text-orange-400',
    dotClasses: 'bg-orange-500',
    tileClasses: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  },
  {
    value: 'meetup',
    label: 'Meetup',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-blue-600 dark:bg-slate-600 dark:text-blue-400',
    dotClasses: 'bg-blue-500',
    tileClasses: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  {
    value: 'sports',
    label: 'Sports',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-green-600 dark:bg-slate-600 dark:text-green-400',
    dotClasses: 'bg-green-500',
    tileClasses: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  },
  {
    value: 'community',
    label: 'Community',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-purple-600 dark:bg-slate-600 dark:text-purple-400',
    dotClasses: 'bg-purple-500',
    tileClasses: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  },
  {
    value: 'other',
    label: 'Other',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-slate-600 dark:bg-slate-600 dark:text-slate-300',
    dotClasses: 'bg-slate-400',
    tileClasses: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200',
  },
];

export function getCategoryMeta(category: string | undefined | null): EventCategory {
  const found =
    EVENT_CATEGORIES.find((c) => c.value === (category || '').trim()) ||
    EVENT_CATEGORIES.find((c) => c.value === 'other')!;
  return found;
}


