export type EventCategory = {
  value: string;
  label: string;
  /** The category pill: slate background, like the icon tiles, with text and
   *  border (`border-current`) in the category color. Matches GroupTypePill. */
  badgeClasses: string;
  dotClasses: string;
  /** The date tile's text color on event cards; the tile itself is ICON_TILE. */
  tileClasses: string;
};

export const EVENT_CATEGORIES: EventCategory[] = [
  {
    value: 'yard_sale',
    label: 'Yard Sale',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-amber-600 dark:bg-slate-600 dark:text-amber-400',
    dotClasses: 'bg-amber-500',
    tileClasses: 'text-amber-600 dark:text-amber-400',
  },
  {
    value: 'group',
    label: 'Group',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-orange-600 dark:bg-slate-600 dark:text-orange-400',
    dotClasses: 'bg-orange-500',
    tileClasses: 'text-orange-600 dark:text-orange-400',
  },
  {
    value: 'meetup',
    label: 'Meetup',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-blue-600 dark:bg-slate-600 dark:text-blue-400',
    dotClasses: 'bg-blue-500',
    tileClasses: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'sports',
    label: 'Sports',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-green-600 dark:bg-slate-600 dark:text-green-400',
    dotClasses: 'bg-green-500',
    tileClasses: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'community',
    label: 'Community',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-purple-600 dark:bg-slate-600 dark:text-purple-400',
    dotClasses: 'bg-purple-500',
    tileClasses: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'other',
    label: 'Other',
    badgeClasses: 'border border-current bg-slate-100 font-medium text-slate-600 dark:bg-slate-600 dark:text-slate-300',
    dotClasses: 'bg-slate-400',
    tileClasses: 'text-slate-600 dark:text-slate-300',
  },
];

export function getCategoryMeta(category: string | undefined | null): EventCategory {
  const found =
    EVENT_CATEGORIES.find((c) => c.value === (category || '').trim()) ||
    EVENT_CATEGORIES.find((c) => c.value === 'other')!;
  return found;
}


