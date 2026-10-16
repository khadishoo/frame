import { cn } from '@/lib/cn';

/** Заглушка контента во время загрузки. Размер и форма задаются через className. */
export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-lg bg-surface-2 motion-safe:animate-pulse', className)}
    />
  );
}
