'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';

type Props = {
  initialQ?: string;
  category?: string;
  condition?: string;
  min?: string;
  max?: string;
};

export default function MarketplaceSearch({
  initialQ = '',
  category = '',
  condition = '',
  min = '',
  max = '',
}: Props) {
  const router = useRouter();
  const [q, setQ] = React.useState(initialQ);

  return (
    <SearchBar
      value={q}
      onChange={setQ}
      onSubmit={(value) => {
        const sp = new URLSearchParams();
        if (value) sp.set('q', value);
        if (category) sp.set('category', category);
        if (condition) sp.set('condition', condition);
        if (min) sp.set('min', min);
        if (max) sp.set('max', max);
        const qs = sp.toString();
        router.push(qs ? `/marketplace?${qs}` : '/marketplace');
      }}
      placeholder="Search items…"
    />
  );
}


