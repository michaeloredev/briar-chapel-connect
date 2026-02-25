import type { LucideIcon } from 'lucide-react';
import { Users, GraduationCap, PawPrint, Activity, Palette, Briefcase } from 'lucide-react';

export type GroupType = {
  value: string;
  label: string;
  colorClasses: { bg: string; icon: string };
  icon: LucideIcon;
};

export const GROUP_TYPES: GroupType[] = [
  { value: 'community',           label: 'Community',            colorClasses: { bg: 'bg-purple-100 dark:bg-purple-900',       icon: 'text-purple-600 dark:text-purple-400' },       icon: Users },
  { value: 'family-education',    label: 'Family & Education',   colorClasses: { bg: 'bg-blue-100 dark:bg-blue-900',           icon: 'text-blue-600 dark:text-blue-400' },           icon: GraduationCap },
  { value: 'pets',                label: 'Pets',                 colorClasses: { bg: 'bg-pink-100 dark:bg-pink-900',           icon: 'text-pink-600 dark:text-pink-400' },           icon: PawPrint },
  { value: 'health-outdoors',     label: 'Health & Outdoors',    colorClasses: { bg: 'bg-green-100 dark:bg-green-900',         icon: 'text-green-600 dark:text-green-400' },         icon: Activity },
  { value: 'hobbies',             label: 'Hobbies',              colorClasses: { bg: 'bg-amber-100 dark:bg-amber-900',         icon: 'text-amber-600 dark:text-amber-400' },         icon: Palette },
  { value: 'local-professionals', label: 'Local Professionals',  colorClasses: { bg: 'bg-slate-100 dark:bg-slate-800',         icon: 'text-slate-600 dark:text-slate-400' },         icon: Briefcase },
];


