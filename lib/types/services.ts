import type { LucideIcon } from 'lucide-react';

export type ServiceItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClasses: { bg: string; icon: string };
  href?: string;
  slug: string;
};

export type ServiceSection = {
  title: string;
  slug: string;
  items: ServiceItem[];
};
