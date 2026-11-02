import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { GROUP_TYPES } from '@/lib/data/group-types';
import { groupIconMeta } from '@/lib/data/group-icon-meta';
import JoinGroupButton from './JoinGroupButton';

export type GroupCardProps = {
  id: string;
  title: string;
  description?: string;
  location?: string | null;
  type: string;
  imageUrl?: string | null;
  /** Chosen icon key; falls back to the type's icon. */
  icon?: string | null;
  isMember?: boolean;
};

export default function GroupCard({ id, title, description, location, type, imageUrl, icon, isMember = false }: GroupCardProps) {
  const meta = GROUP_TYPES.find((t) => t.value === type);
  const avatar = groupIconMeta({ type, icon });
  const Icon = avatar.icon;

  return (
    // The title link stretches over the whole card through its ::after, so the
    // card is one click target without wrapping the Join button in a link;
    // the button sits above it (relative z-10) to stay clickable on its own.
    <article className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blue-500 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover dark:border-slate-700 dark:bg-slate-900"
            width={56}
            height={56}
          />
        ) : (
          <span
            className={[
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
              avatar.bg,
            ].join(' ')}
          >
            <Icon className={['h-7 w-7', avatar.color].join(' ')} aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3>
            <Link
              href={`/groups/${id}`}
              className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 focus:outline-none after:absolute after:inset-0 after:rounded-2xl dark:text-white dark:group-hover:text-blue-400"
            >
              {title}
            </Link>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                meta ? `${meta.colorClasses.bg} ${meta.colorClasses.icon}` : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
              ].join(' ')}
            >
              {meta?.label ?? type}
            </span>
            {isMember ? (
              <span className="rounded-full border border-blue-400 px-2 py-0.5 text-xs font-medium text-blue-500 dark:border-blue-400 dark:text-blue-400">
                Member
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {description ? (
        <p className="mt-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      ) : null}
      {location ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <MapPin className="h-4 w-4 text-slate-400" aria-hidden />
          {location}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <JoinGroupButton groupId={id} isMember={isMember} className="relative z-10" />
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400" aria-hidden>
          View group
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
