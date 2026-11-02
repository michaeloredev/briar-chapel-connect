import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/PageHeader';
import SupportForm from '@/components/support/SupportForm';

export const metadata: Metadata = {
  title: 'Support • Briar Chapel Connect',
  description: 'Report a problem or ask a question about Briar Chapel Connect',
};

export default function SupportPage() {
  return (
    <div className="flex-1 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PageHeader
          title="Support"
          description="Found a bug, stuck signing in, or have an idea? Send us a note and we'll get back to you by email."
        />
        <SupportForm />
      </div>
    </div>
  );
}
