import { useEffect } from 'react';

// Счётчик нужен, если открыто несколько оверлеев сразу (модалка поверх меню)
let locks = 0;

/** Запрещает прокрутку страницы под открытой модалкой или меню. */
export const useLockBodyScroll = (active) => {
  useEffect(() => {
    if (!active) return undefined;

    if (locks === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      // Компенсируем исчезнувшую полосу прокрутки, чтобы контент не «прыгал»
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    locks += 1;

    return () => {
      locks -= 1;
      if (locks === 0) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
  }, [active]);
};
