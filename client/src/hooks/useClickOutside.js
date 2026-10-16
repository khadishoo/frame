import { useEffect } from 'react';

/** Вызывает handler при клике/тапе вне всех переданных элементов. */
export const useClickOutside = (refs, handler, active = true) => {
  useEffect(() => {
    if (!active) return undefined;

    const listener = (event) => {
      const inside = refs.some((ref) => ref.current?.contains(event.target));
      if (!inside) handler(event);
    };

    document.addEventListener('pointerdown', listener);
    return () => document.removeEventListener('pointerdown', listener);
  }, [refs, handler, active]);
};
