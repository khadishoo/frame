import { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Нативный чекбокс с кастомным внешним видом (клавиатура и скринридеры работают как обычно). */
export function Checkbox({ label, description, className, disabled, ...props }) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span className="relative mt-0.5 flex size-5 shrink-0">
        <input
          id={id}
          type="checkbox"
          disabled={disabled}
          aria-describedby={descriptionId}
          className={cn(
            'peer size-5 cursor-pointer appearance-none rounded-md border border-border bg-surface shadow-soft transition-colors',
            'checked:border-accent checked:bg-accent hover:border-muted/50',
            'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          {...props}
        />
        <Check
          className="pointer-events-none absolute inset-0 m-auto size-3.5 text-accent-fg opacity-0 transition-opacity peer-checked:opacity-100"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'cursor-pointer text-sm font-medium text-fg',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span id={descriptionId} className="text-xs text-muted">
              {description}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
