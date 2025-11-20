export type EventCategory = {
  value: string;
  label: string;
  badgeClasses: string;
  dotClasses: string;
};

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    value: 'yard_sale',
    label: 'Yard Sale',
    badgeClasses: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    dotClasses: 'bg-amber-500',
  },
  {
    value: 'meetup',
    label: 'Meetup',
    badgeClasses: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    dotClasses: 'bg-blue-500',
  },
  {
    value: 'sports',
    label: 'Sports',
    badgeClasses: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dotClasses: 'bg-green-500',
  },
  {
    value: 'community',
    label: 'Community',
    badgeClasses: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    dotClasses: 'bg-purple-500',
  },
  {
    value: 'other',
    label: 'Other',
    badgeClasses: 'bg-slate-100 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200',
    dotClasses: 'bg-slate-400',
  },
];

export function getCategoryMeta(category: string | undefined | null): EventCategory {
  const found =
    EVENT_CATEGORIES.find((c) => c.value === (category || '').trim()) ||
    EVENT_CATEGORIES.find((c) => c.value === 'other')!;
  return found;
}


