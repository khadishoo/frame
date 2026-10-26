import { CloudOff, RotateCw, TriangleAlert } from 'lucide-react';
import { getErrorMessage, isConnectionError } from '@/lib/getErrorMessage';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

/**
 * Не удалось загрузить данные: что случилось и кнопка «Повторить».
 * onRetry — обычно refetch из useQuery; retrying — isRefetching (кнопка крутится).
 * action — дополнительная кнопка/ссылка рядом с «Повторить» (например «Назад»).
 */
export function ErrorState({ error, title, onRetry, retrying = false, action, className }) {
  const offline = isConnectionError(error);

  return (
    <div role="alert" className={className}>
      <EmptyState
        icon={offline ? CloudOff : TriangleAlert}
        title={title}
        description={getErrorMessage(error)}
        action={
          (onRetry || action) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {onRetry && (
                <Button
                  variant="secondary"
                  leftIcon={<RotateCw />}
                  loading={retrying}
                  onClick={() => onRetry()}
                >
                  Повторить
                </Button>
              )}
              {action}
            </div>
          )
        }
      />
    </div>
  );
}
