import { cn } from '@/lib/cn';

/**
 * Пустое состояние: иконка, заголовок, пояснение и действие.
 * icon — компонент иконки lucide.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'bg-grain flex flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="relative flex size-14 items-center justify-center">
          {/* Уголки кадра — фирменная деталь Frame */}
          <svg
            className="absolute inset-0 size-full text-muted/40"
            viewBox="0 0 56 56"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 14V6a4 4 0 0 1 4-4h8M42 2h8a4 4 0 0 1 4 4v8M54 42v8a4 4 0 0 1-4 4h-8M14 54H6a4 4 0 0 1-4-4v-8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <Icon className="size-6 text-muted" aria-hidden="true" />
        </div>
      )}
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
