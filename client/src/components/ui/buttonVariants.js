import { cn } from '@/lib/cn';

const base =
  'focus-ring inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-[background-color,border-color,color,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const variants = {
  primary: 'bg-accent text-accent-fg shadow-soft hover:bg-accent/90',
  secondary: 'border border-border bg-surface text-fg shadow-soft hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white shadow-soft hover:bg-danger/90 dark:text-bg',
};

const sizes = {
  sm: 'h-8 px-3 text-sm [&_svg]:size-4',
  md: 'h-10 px-4 text-sm [&_svg]:size-4',
  lg: 'h-12 px-6 text-base [&_svg]:size-5',
  icon: 'size-10 [&_svg]:size-5',
  'icon-sm': 'size-8 [&_svg]:size-4',
};

/**
 * Классы кнопки отдельно от компонента — чтобы стилизовать как кнопку и <Link>:
 * <Link className={buttonVariants({ variant: 'secondary' })} to="/">…</Link>
 */
export const buttonVariants = ({ variant = 'primary', size = 'md', className } = {}) =>
  cn(base, variants[variant], sizes[size], className);
