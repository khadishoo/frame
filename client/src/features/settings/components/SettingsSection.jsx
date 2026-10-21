import { cn } from '@/lib/cn';

/**
 * Карточка-раздел на страницах настроек.
 * tone="danger" — для «Опасной зоны» (красная рамка).
 * footer — строка с кнопками внизу карточки.
 */
export function SettingsSection({ title, description, tone, footer, children, className }) {
  const danger = tone === 'danger';

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border bg-surface shadow-soft',
        danger ? 'border-danger/40' : 'border-border',
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className={cn('text-lg font-semibold', danger ? 'text-danger' : 'text-fg')}>
            {title}
          </h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {children}
      </div>
      {footer && (
        <div
          className={cn(
            'flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6',
            danger ? 'border-danger/20 bg-danger/5' : 'border-border bg-surface-2/50',
          )}
        >
          {footer}
        </div>
      )}
    </section>
  );
}
