import { Link, isRouteErrorResponse, useLocation, useNavigate, useRouteError } from 'react-router';
import { FileQuestion, RefreshCw, RotateCw, TriangleAlert } from 'lucide-react';
import { Button, EmptyState, buttonVariants } from '@/components/ui';

// После нового релиза старые чанки удаляются с хостинга — открытая вкладка их уже не скачает
const isChunkLoadError = (error) =>
  error instanceof Error &&
  /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(
    error.message,
  );

const toDashboard = (
  <Link to="/app" className={buttonVariants({ variant: 'ghost' })}>
    На дашборд
  </Link>
);

/** 404 внутри приложения: сайдбар и топбар остаются на месте. */
export function AppNotFound() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Кадр не найден"
      description="Такой страницы нет — возможно, ссылка устарела или в адресе опечатка."
      action={
        <Link to="/app" className={buttonVariants({ variant: 'secondary' })}>
          На дашборд
        </Link>
      }
      className="mt-6"
    />
  );
}

/**
 * Граница ошибок одной страницы (errorElement маршрутов внутри AppLayout):
 * если страница упала при отрисовке, каркас приложения остаётся, а на месте страницы —
 * объяснение и «Повторить». Ошибки запросов сюда не попадают — их показывает ErrorState.
 */
export function PageError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();

  if (isRouteErrorResponse(error) && error.status === 404) return <AppNotFound />;

  if (isChunkLoadError(error)) {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Вышла новая версия Frame"
        description="Обновите страницу, чтобы загрузить её. Несохранённого здесь нет."
        action={
          <Button leftIcon={<RefreshCw />} onClick={() => window.location.reload()}>
            Обновить страницу
          </Button>
        }
        className="mt-6"
      />
    );
  }

  return (
    <div role="alert">
      <EmptyState
        icon={TriangleAlert}
        title="Эта страница сломалась"
        description={
          import.meta.env.DEV && error instanceof Error
            ? error.message
            : 'Мы уже знаем, что так быть не должно. Попробуйте ещё раз или откройте другой раздел.'
        }
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Навигация на тот же адрес сбрасывает ошибку маршрута — страница рисуется заново */}
            <Button
              variant="secondary"
              leftIcon={<RotateCw />}
              onClick={() =>
                navigate(location.pathname + location.search + location.hash, { replace: true })
              }
            >
              Повторить
            </Button>
            {toDashboard}
          </div>
        }
        className="mt-6"
      />
    </div>
  );
}
