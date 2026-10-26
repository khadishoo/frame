import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';

const variants = {
  danger: { Icon: CircleAlert, className: 'border-danger/30 bg-danger/5 text-danger' },
  warning: { Icon: TriangleAlert, className: 'border-warning/30 bg-warning/5 text-warning' },
  success: { Icon: CircleCheck, className: 'border-success/30 bg-success/5 text-success' },
  info: { Icon: Info, className: 'border-border bg-surface-2 text-fg' },
};

/**
 * Сообщение внутри страницы или формы (не всплывающее, в отличие от Toast).
 * Для ошибок role="alert" — скринридер прочитает его сразу.
 */
export function Alert({ variant = 'info', title, children, className }) {
  const { Icon, className: tone } = variants[variant];

  return (
    <m.div
      role={variant === 'danger' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        tone,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && 'text-fg/80')}>{children}</div>}
      </div>
    </m.div>
  );
}
