import { GROUP_TYPES } from '@/lib/data/group-types';
import { ICON_TILE_BG } from '@/components/ui/iconTile';

export type GroupTypePillProps = {
  type: string;
  /** Extra classes, e.g. padding for a larger header. */
  className?: string;
};

/**
 * A group's type as a pill: slate background, like the icon tiles, with the
 * text and border in the type's icon color. The border is `border-current`,
 * so it always follows the text color.
 */
export default function GroupTypePill({ type, className = 'px-2' }: GroupTypePillProps) {
  const meta = GROUP_TYPES.find((t) => t.value === type);
  return (
    <span
      className={[
        'rounded-full border border-current py-0.5 text-xs font-medium',
        ICON_TILE_BG,
        meta?.colorClasses.icon ?? 'text-slate-700 dark:text-slate-200',
        className,
      ].join(' ')}
    >
      {meta?.label ?? type}
    </span>
  );
}
