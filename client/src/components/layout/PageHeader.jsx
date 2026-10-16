import { cn } from '@/lib/cn';

/** Заголовок страницы + <title> вкладки (React 19 сам поднимает <title> в <head>). */
export function PageHeader({ title, description, actions, eyebrow, className }) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <title>{`${title} · Frame`}</title>
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow}
        <h1 className="text-xl font-semibold text-fg sm:text-2xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
