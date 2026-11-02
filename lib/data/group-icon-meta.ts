import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { GROUP_TYPES } from '@/lib/data/group-types';

// Server only (server components and API routes). Looking an icon up by name
// means importing every icon, which is fine on the server but would ship the
// whole set to the browser -- client components use <DynamicIcon> from
// 'lucide-react/dynamic' instead. The reverse also holds: that module is
// marked 'use client', so its iconNames list is unusable here.

/** "gamepad-2" -> "Gamepad2", the name lucide-react exports it under. */
function exportName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const ICONS = Lucide as unknown as Record<string, LucideIcon | undefined>;

/** Lucide exports that are not icons, so their names are never a valid choice. */
const NOT_ICONS = new Set(['icon', 'icons', 'create-lucide-icon', 'lucide-provider']);

/** The component for a stored icon name, or null if it isn't a Lucide icon. */
function lookupIcon(name: string): LucideIcon | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || NOT_ICONS.has(name)) return null;
  return ICONS[exportName(name)] ?? null;
}

/** Whether `name` is a Lucide icon a group may use. */
export function isGroupIcon(name: string): boolean {
  return lookupIcon(name) !== null;
}

/**
 * What a group shows as its avatar: its chosen icon, else its type's icon,
 * always tinted with the type's colors. A picture, when the group has one, is
 * drawn instead of this by the caller.
 */
export function groupIconMeta(group: { type: string; icon?: string | null }): {
  icon: LucideIcon;
  bg: string;
  color: string;
} {
  const type = GROUP_TYPES.find((t) => t.value === group.type);
  const chosen = group.icon ? lookupIcon(group.icon) : null;
  return {
    icon: chosen ?? type?.icon ?? Lucide.Users,
    bg: type?.colorClasses.bg ?? 'bg-slate-100 dark:bg-slate-800',
    color: type?.colorClasses.icon ?? 'text-slate-600 dark:text-slate-300',
  };
}
