import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Groups & Clubs • Briar Chapel Connect',
  description: 'Join groups and clubs in Briar Chapel',
};

export default function GroupsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Groups & Clubs</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-8">
        Connect with neighbors who share your interests.
      </p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-8 bg-white dark:bg-slate-800">
        <p className="text-slate-600 dark:text-slate-300">Scaffold placeholder. List groups and clubs here.</p>
      </div>
    </div>
  );
}
