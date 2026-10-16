import { LoaderCircle } from 'lucide-react';
import { buttonVariants } from './buttonVariants';

/**
 * Кнопка. variant: primary | secondary | ghost | danger; size: sm | md | lg | icon | icon-sm.
 * loading — показывает спиннер и блокирует повторные нажатия.
 * Для кнопки-иконки обязательно передайте aria-label.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
