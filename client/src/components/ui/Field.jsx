import { useId } from 'react';
import { cn } from '@/lib/cn';

/**
 * Обёртка поля: подпись, подсказка, ошибка и связка aria-атрибутов.
 * children — функция, получающая { id, describedBy, invalid }.
 */
export function Field({ label, hint, error, required, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
