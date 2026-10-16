import { cn } from '@/lib/cn';

/** Общие стили полей ввода — используются в Input, Textarea, Select. */
export const fieldClasses = (invalid) =>
  cn(
    'w-full rounded-lg border bg-surface text-sm text-fg shadow-soft transition-colors placeholder:text-muted/70',
    'outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
    'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60',
    invalid
      ? 'border-danger focus-visible:ring-danger/30'
      : 'border-border hover:border-muted/40 focus-visible:border-ring focus-visible:ring-ring/25',
  );
