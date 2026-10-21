import { cn } from '@/lib/cn';
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from '@/lib/projectTypes';

/**
 * Выбор одного творческого типа компактными карточками (radiogroup).
 * Стрелки ←/→ переключают тип, как у обычных радиокнопок.
 */
export function TypeSelect({ value, onChange, error, labelId }) {
  const select = (index) => {
    const key = PROJECT_TYPE_KEYS[(index + PROJECT_TYPE_KEYS.length) % PROJECT_TYPE_KEYS.length];
    onChange(key);
    document.getElementById(`type-option-${key}`)?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-invalid={Boolean(error) || undefined}
      className="grid grid-cols-4 gap-2 sm:grid-cols-7"
    >
      {PROJECT_TYPE_KEYS.map((key, index) => {
        const { label, icon: Icon, soft, text } = PROJECT_TYPES[key];
        const checked = value === key;
        return (
          <button
            key={key}
            id={`type-option-${key}`}
            type="button"
            role="radio"
            aria-checked={checked}
            // В группе в порядок Tab попадает только выбранный (или первый)
            tabIndex={checked || (!value && index === 0) ? 0 : -1}
            onClick={() => onChange(key)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                select(index + 1);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                select(index - 1);
              }
            }}
            className={cn(
              'focus-ring flex min-w-0 flex-col items-center gap-1.5 rounded-lg border px-0.5 py-2.5 text-[11px] font-medium transition-colors sm:text-xs',
              checked
                ? cn('border-transparent ring-2 ring-inset ring-current', soft, text)
                : error
                  ? 'border-danger/50 text-muted hover:text-fg'
                  : 'border-border text-muted hover:border-muted/40 hover:text-fg',
            )}
          >
            <Icon className={cn('size-5', text)} aria-hidden="true" />
            <span className={checked ? 'text-fg' : undefined}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
