import { iconNames, type IconName } from 'lucide-react/dynamic';

/**
 * Group icons are any Lucide icon, stored in groups.icon by its kebab-case
 * name ("dog", "gamepad-2"). Client components only: iconNames comes from a
 * 'use client' module, so on the server it is a reference, not an array. The
 * server side (validation, rendering) is group-icon-meta.ts.
 */

/** Shown in the picker before anyone searches. */
export const SUGGESTED_GROUP_ICONS: IconName[] = [
  'users', 'heart', 'hand-helping', 'paw-print', 'dog', 'cat', 'footprints', 'bike',
  'dumbbell', 'trophy', 'flag', 'fish', 'tree-pine', 'sprout', 'sun', 'tent',
  'book-open', 'graduation-cap', 'baby', 'music', 'guitar', 'palette', 'camera', 'gamepad-2',
  'puzzle', 'utensils', 'coffee', 'wine', 'hammer', 'car', 'church', 'star',
];

const NAMES = new Set<string>(iconNames);

export function isGroupIcon(name: string): name is IconName {
  return NAMES.has(name);
}

/** Icon names matching every word of `query`, best (shortest) names first. */
export function searchGroupIcons(query: string, limit: number): { results: IconName[]; total: number } {
  const words = query.toLowerCase().split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return { results: SUGGESTED_GROUP_ICONS.slice(0, limit), total: SUGGESTED_GROUP_ICONS.length };
  const matches = iconNames
    .filter((name) => words.every((w) => name.includes(w)))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
  return { results: matches.slice(0, limit), total: matches.length };
}

/** "gamepad-2" -> "Gamepad 2", for titles and screen readers. */
export function iconLabel(name: string): string {
  const spaced = name.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
