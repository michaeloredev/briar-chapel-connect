/**
 * Every services page shares this background and container. Pages that
 * show the category side menu wrap their content in ServicesShell.
 */
export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-linear-to-b from-page-top to-page-bottom dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">{children}</div>
    </div>
  );
}
