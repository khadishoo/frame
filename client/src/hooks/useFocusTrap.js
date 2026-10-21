import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusable = (container) =>
  [...container.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[inert]'));

/**
 * Держит фокус внутри контейнера, пока active === true (модалки, выдвижное меню).
 * При открытии фокусирует initialFocusRef или первый интерактивный элемент,
 * при закрытии возвращает фокус туда, где он был.
 */
export const useFocusTrap = (containerRef, active, initialFocusRef) => {
  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const previouslyFocused = document.activeElement;
    // Поле с autoFocus внутри окна уже получило фокус — не перехватываем
    // (иначе оно «потеряет» фокус и форма сразу покажет ошибку «обязательное поле»)
    const alreadyInside = !initialFocusRef && container.contains(document.activeElement);
    if (!alreadyInside) {
      const initial = initialFocusRef?.current ?? getFocusable(container)[0] ?? container;
      initial.focus({ preventScroll: true });
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === container)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, containerRef, initialFocusRef]);
};
