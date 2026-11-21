import ServicesNav from '@/components/services/ServicesNav';
import { providerCounts } from '@/lib/api/service-counts';

type Props = {
  /** The page's title block, shown full width above the menu and content. */
  header: React.ReactNode;
  children: React.ReactNode;
};

/**
 * A services page with the category side menu: the title across the top,
 * then the menu and the page's content side by side, starting level with
 * each other. The overview doesn't use it — it is itself the full directory
 * of sections, so a menu there would only repeat it.
 */
export default async function ServicesShell({ header, children }: Props) {
  const counts = Object.fromEntries(await providerCounts());

  return (
    <>
      {header}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <aside className="lg:w-72 lg:shrink-0 lg:self-stretch">
          <ServicesNav counts={counts} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
