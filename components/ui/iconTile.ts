/**
 * The tile behind a colored icon: slate (gunmetal in dark mode), the cards'
 * border, and a soft shadow that falls down and to the right, as if lit from
 * the top-left corner of the page. The caller adds the size, rounding and the
 * icon's own color. Used by the home page tiles and group avatars.
 */
export const ICON_TILE =
  'border border-slate-200 bg-slate-100 shadow-[4px_5px_14px_-3px_rgb(15_23_42/0.14)] dark:border-slate-700 dark:bg-slate-600 dark:shadow-[4px_5px_14px_-3px_rgb(0_0_0/0.4)]';

/** The tile's background alone, for a selected state that matches it. */
export const ICON_TILE_BG = 'bg-slate-100 dark:bg-slate-600';
