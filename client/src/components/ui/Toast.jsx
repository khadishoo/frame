import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToastStore } from '@/lib/toast';

const icons = {
  success: { Icon: CircleCheck, className: 'text-success' },
  error: { Icon: CircleAlert, className: 'text-danger' },
  warning: { Icon: TriangleAlert, className: 'text-warning' },
  info: { Icon: Info, className: 'text-muted' },
};

function ToastItem({ toast }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const { Icon, className } = icons[toast.variant];

  useEffect(() => {
    if (!toast.duration) return undefined;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration, dismiss]);

  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-pop"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', className)} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium text-fg">{toast.title}</p>
        {toast.description && <p className="text-sm text-muted">{toast.description}</p>}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick();
              dismiss(toast.id);
            }}
            className="focus-ring mt-1 w-fit rounded text-sm font-medium text-fg underline underline-offset-4"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="focus-ring -m-1 rounded-md p-1 text-muted transition-colors hover:text-fg"
        aria-label="Закрыть уведомление"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </m.li>
  );
}

/**
 * Контейнер уведомлений — один на всё приложение (подключён в App.jsx).
 * Показывать уведомления: toast.success(…) из '@/lib/toast'.
 */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return createPortal(
    <ol
      aria-live="polite"
      // На мобильных поднимаем над нижним таб-баром (он скрывается с md)
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:left-auto sm:w-96 sm:items-end md:pb-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </ol>,
    document.body,
  );
}
