import { Check, CircleAlert, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Состояние автосохранения: state — 'idle' | 'saving' | 'saved' | 'error'.
 * «Сохраняется… / Сохранено ✓ / Не сохранено» — для экранного диктора тоже (aria-live).
 */
export function SaveStatus({ state, className }) {
  return (
    <span aria-live="polite" className={cn('flex h-5 items-center text-xs', className)}>
      {state === 'saving' && (
        <span className="flex items-center gap-1.5 text-muted">
          <LoaderCircle className="size-3 animate-spin" aria-hidden="true" /> Сохраняется…
        </span>
      )}
      {state === 'saved' && (
        <span className="flex items-center gap-1 text-success">
          Сохранено <Check className="size-3.5" aria-hidden="true" />
        </span>
      )}
      {state === 'error' && (
        <span className="flex items-center gap-1 text-danger">
          <CircleAlert className="size-3.5" aria-hidden="true" /> Не сохранено
        </span>
      )}
    </span>
  );
}
