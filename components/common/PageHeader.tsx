import React from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={[
      'mb-6 sm:mb-8',
      'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3',
      className || '',
    ].join(' ')}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description ? (
          <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-3xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
