import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { useHealth } from '../hooks/useHealth';

/** Статус соединения клиент → API → БД (GET /api/v1/health). */
export default function ApiStatus() {
  const { data, error, isPending, isFetching, refetch } = useHealth();

  let dot = 'bg-muted motion-safe:animate-pulse';
  let text = 'Проверяю соединение…';
  if (error) {
    dot = 'bg-danger';
    text = `Ошибка: ${getErrorMessage(error)}`;
  } else if (!isPending) {
    dot = 'bg-success';
    text = `API: ${data.status} / DB: ${data.db}`;
  }

  return (
    <div className="flex items-center gap-1">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'flex h-8 items-center gap-2 rounded-full border border-border bg-surface px-3 font-mono text-xs',
          error ? 'text-danger' : 'text-fg',
        )}
      >
        <span className={cn('size-2 rounded-full', dot)} aria-hidden="true" />
        {text}
      </div>
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        aria-label="Проверить соединение снова"
        title="Проверить снова"
        className="focus-ring rounded-full p-2 text-muted transition-colors hover:text-fg disabled:opacity-50"
      >
        <RotateCw className={cn('size-3.5', isFetching && 'animate-spin')} aria-hidden="true" />
      </button>
    </div>
  );
}
