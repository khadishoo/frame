import { cn } from '@/lib/cn';
import { PROJECT_TYPES } from '@/lib/projectTypes';

const variants = {
  neutral: 'bg-surface-2 text-fg',
  outline: 'border border-border text-muted',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent text-accent-fg',
};

/**
 * Метка: статус, счётчик, тег.
 * type — творческий тип проекта (art, music…): цветная точка и подпись по умолчанию.
 */
export function Badge({ variant = 'neutral', type, dot = false, className, children }) {
  const projectType = type ? PROJECT_TYPES[type] : null;

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium',
        projectType ? cn(projectType.soft, 'text-fg') : variants[variant],
        className,
      )}
    >
      {(dot || projectType) && (
        <span
          className={cn('size-1.5 rounded-full', projectType ? projectType.dot : 'bg-current')}
          aria-hidden="true"
        />
      )}
      {children ?? projectType?.label}
    </span>
  );
}
