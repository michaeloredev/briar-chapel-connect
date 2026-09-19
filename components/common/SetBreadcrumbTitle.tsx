'use client';

import * as React from 'react';
import { useBreadcrumbTitle } from '@/components/common/BreadcrumbTitleProvider';

/**
 * Renders nothing. Publishes the given label for the last breadcrumb segment
 * while the page is mounted, and clears it on navigation away.
 */
export default function SetBreadcrumbTitle({ value }: { value: string | null | undefined }) {
  const { setTitle } = useBreadcrumbTitle();

  React.useEffect(() => {
    const label = (value ?? '').trim();
    setTitle(label || null);
    return () => setTitle(null);
  }, [value, setTitle]);

  return null;
}
