import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Marketplace Item • Briar Chapel Connect',
};

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MarketplaceDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Item #{id}</h1>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-8 bg-white dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-300">Scaffold placeholder. Show item details here.</p>
      </div>
    </div>
  );
}
