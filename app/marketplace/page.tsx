import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace • Brirar Chapel Connect',
  description: 'Browse items for sale in Brirar Chapel',
};

export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Marketplace</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-8">
        Buy and sell with neighbors.
      </p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-8 bg-white dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-300">Scaffold placeholder. List marketplace items here.</p>
      </div>
    </div>
  );
}
