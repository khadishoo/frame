import { Skeleton } from '@/components/ui';
import { TASK_STATUS_KEYS } from '@/lib/taskMeta';

/** Заглушка доски: и пока грузятся задачи, и пока едет код доски (dnd-kit). */
export function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-4" aria-hidden="true">
      {TASK_STATUS_KEYS.map((status) => (
        <div key={status} className="flex w-72 shrink-0 flex-col gap-2 lg:w-auto">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-24" />
          <Skeleton className="h-20" />
        </div>
      ))}
    </div>
  );
}
