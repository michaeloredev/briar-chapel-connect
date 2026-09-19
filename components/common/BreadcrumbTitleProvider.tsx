'use client';

import * as React from 'react';

type BreadcrumbTitleContextValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
};

const BreadcrumbTitleContext = React.createContext<BreadcrumbTitleContextValue>({
  title: null,
  setTitle: () => {},
});

export function useBreadcrumbTitle() {
  return React.useContext(BreadcrumbTitleContext);
}

/**
 * Holds a label for the current page's last breadcrumb segment, so pages with
 * opaque ids in their URL can show a readable title in the layout's breadcrumb bar.
 */
export default function BreadcrumbTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = React.useState<string | null>(null);
  const value = React.useMemo(() => ({ title, setTitle }), [title]);

  return <BreadcrumbTitleContext.Provider value={value}>{children}</BreadcrumbTitleContext.Provider>;
}
