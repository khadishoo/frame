import { getErrorMessage } from '@/lib/getErrorMessage';
import { useHealth } from '../hooks/useHealth';

const Dot = ({ className }) => (
  <span className={`inline-block h-2.5 w-2.5 rounded-full ${className}`} aria-hidden="true" />
);

export default function ApiStatus() {
  const { data, error, isPending, isFetching, refetch } = useHealth();

  let content;
  if (isPending) {
    content = (
      <>
        <Dot className="animate-pulse bg-zinc-400" />
        <span>Проверяю соединение…</span>
      </>
    );
  } else if (error) {
    content = (
      <>
        <Dot className="bg-red-500" />
        <span className="text-red-600 dark:text-red-400">Ошибка: {getErrorMessage(error)}</span>
      </>
    );
  } else {
    content = (
      <>
        <Dot className="bg-emerald-500" />
        <span>
          API: {data.status} / DB: {data.db}
        </span>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 font-mono text-sm dark:border-zinc-800"
      >
        {content}
      </div>
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="text-sm text-zinc-500 underline-offset-4 hover:underline disabled:opacity-50 dark:text-zinc-400"
      >
        {isFetching ? 'Проверяю…' : 'Проверить снова'}
      </button>
    </div>
  );
}
