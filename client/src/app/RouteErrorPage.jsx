import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ErrorScreen } from './NotFoundPage';

/** Показывается, если при отрисовке страницы произошла ошибка. */
export default function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <ErrorScreen code="404" title="Кадр не найден" description="Такой страницы нет." />;
  }

  return (
    <ErrorScreen
      code="Ой"
      title="Что-то пошло не так"
      description={
        import.meta.env.DEV && error instanceof Error
          ? error.message
          : 'Попробуйте обновить страницу или вернуться назад.'
      }
    />
  );
}
