import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serviceSections } from '@/lib/data/services';
import { PageHeader } from '@/components/common/PageHeader';

export const metadata: Metadata = {
  title: 'Services Category • Briar Chapel Connect',
};

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function ServicesCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const section = serviceSections.find((s) => s.slug === category);
  if (!section) return notFound();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader title={section.title} description="Browse services in this category." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item) => (
            <Link
              key={item.slug}
              href={`/services/${section.slug}/${item.slug}`}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-slate-600"
            >
              <div className={`w-12 h-12 ${item.colorClasses.bg} rounded-lg flex items-center justify-center mb-4`}>
                <item.icon className={`w-6 h-6 ${item.colorClasses.icon}`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-300 mt-1">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
