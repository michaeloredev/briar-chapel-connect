"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

type BreadcrumbsProps = {
  className?: string;
  labelOverrides?: Record<string, string>;
  hideHome?: boolean;
  separator?: React.ReactNode;
};

function toTitle(segment: string, overrides?: Record<string, string>) {
  if (overrides && overrides[segment]) return overrides[segment];
  const s = decodeURIComponent(segment).replace(/-/g, " ");
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

export function Breadcrumbs({
  className = "py-3 md:py-4",
  labelOverrides,
  hideHome = false,
  separator,
}: BreadcrumbsProps) {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/");
    const label = toTitle(part, labelOverrides);
    const isLast = idx === parts.length - 1;
    return { href, label, isLast };
  });

  const Sep = (
    <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
  );

  return (
    <nav className={className} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        {!hideHome && (
          <li>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
              Home
            </Link>
          </li>
        )}
        {crumbs.map((c, idx) => (
          <li key={c.href} className="flex items-center gap-2">
            {idx > 0 || !hideHome ? (separator ?? Sep) : null}
            {c.isLast ? (
              <span aria-current="page" className="text-slate-700 dark:text-slate-200">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="hover:text-slate-900 dark:hover:text-white">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const defaultLabelOverrides: Record<string, string> = {
  services: 'Services',
  marketplace: 'Marketplace',
  events: 'Events',
  groups: 'Groups',
  'ev-charging-locations': 'EV Charging Locations',
};
