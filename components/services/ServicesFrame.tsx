'use client';

import { usePathname } from 'next/navigation';
import ServicesNav from '@/components/services/ServicesNav';

type Props = {
  counts: Record<string, number>;
  children: React.ReactNode;
};

/**
 * The services frame: the category side menu beside the page, on every
 * services page except the overview. The overview is itself the full
 * directory of sections, so a menu repeating it would only leave an empty
 * column beside a long page.
 */
export default function ServicesFrame({ counts, children }: Props) {
  const pathname = usePathname() ?? '';
  if (pathname === '/services') return <>{children}</>;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="lg:w-72 lg:shrink-0 lg:self-stretch">
        <ServicesNav counts={counts} />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
