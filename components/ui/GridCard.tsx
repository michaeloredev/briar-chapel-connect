import { LucideIcon } from 'lucide-react';

interface GridCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClasses: {
    bg: string;
    icon: string;
  };
}

export function GridCard({ icon: Icon, title, description, colorClasses }: GridCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow min-h-[220px] flex flex-col items-start">
      <div className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </div>
  );
}

