import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Group • Briar Chapel Connect',
};

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return notFound();

  const supabase = await createClient();
  type Row = Database['public']['Tables']['groups']['Row'];
  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single<Row>();
  if (error || !group) return notFound();

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{group.title}</h1>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {group.location ? group.location : 'Briar Chapel'} • {new Date(group.created_at).toLocaleString()}
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800">
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {group.description}
          </p>
        </div>
      </div>
    </div>
  );
}
