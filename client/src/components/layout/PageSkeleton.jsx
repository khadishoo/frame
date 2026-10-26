import { Skeleton } from '@/components/ui';

/**
 * Заглушка, пока грузится код страницы (React.lazy).
 * variant="app" — заголовок и сетка карточек, как у страниц приложения;
 * variant="form" — блок формы для входа/регистрации/онбординга.
 */
export function PageSkeleton({ variant = 'app' }) {
  if (variant === 'form') {
    return (
      <div className="flex w-full flex-col gap-4" role="status" aria-label="Загрузка страницы">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Загрузка страницы">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
