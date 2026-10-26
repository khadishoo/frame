import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { Button } from './Button';

const sizes = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

function ModalContent({
  onClose,
  title,
  description,
  children,
  footer,
  size,
  closeOnBackdrop,
  initialFocusRef,
  hideClose,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useFocusTrap(panelRef, true, initialFocusRef);
  useLockBodyScroll(true);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <m.div
        className="absolute inset-0 bg-overlay/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          // На телефоне — «шторка» снизу, на больших экранах — окно по центру
          'relative flex max-h-[90dvh] w-full flex-col rounded-t-xl border border-border bg-surface shadow-pop outline-none sm:rounded-xl',
          sizes[size],
        )}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-5">
            <div className="flex flex-col gap-1">
              {title && (
                <h2 id={titleId} className="text-lg font-semibold text-fg">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descriptionId} className="text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Закрыть"
                className="-mr-2 -mt-1 text-muted"
              >
                <X />
              </Button>
            )}
          </div>
        )}
        {children && <div className="overflow-y-auto px-6 py-3">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </m.div>
    </div>
  );
}

/**
 * Модальное окно: портал в <body>, ловушка фокуса, закрытие по Esc и клику по фону,
 * блокировка прокрутки страницы. Фокус возвращается на кнопку, которая открыла окно.
 */
export function Modal({
  open,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  hideClose = false,
  ...props
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalContent
          onClose={onClose}
          size={size}
          closeOnBackdrop={closeOnBackdrop}
          hideClose={hideClose}
          {...props}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}
