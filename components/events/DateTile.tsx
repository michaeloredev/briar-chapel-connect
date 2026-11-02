import { getCategoryMeta } from '@/lib/data/event-categories';
import { formatDateTile } from '@/lib/utils/date';

/**
 * Compact weekday-over-day badge for an event's start, in Briar Chapel time,
 * tinted with the event's category color to match its badge and calendar dot.
 */
export default function DateTile({ iso, category }: { iso: string; category?: string | null }) {
  const tile = formatDateTile(iso);
  return (
    <span
      className={[
        'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl leading-none',
        getCategoryMeta(category).tileClasses,
      ].join(' ')}
    >
      <span className="text-xs font-bold uppercase">{tile?.weekday}</span>
      <span className="text-xl font-bold">{tile?.day}</span>
    </span>
  );
}
