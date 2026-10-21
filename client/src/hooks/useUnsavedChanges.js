import { useEffect } from 'react';
import { useBlocker } from 'react-router';

/**
 * Предупреждение о несохранённых изменениях.
 * - переход внутри приложения → blocker.state === 'blocked' (показываем свой диалог);
 * - перезагрузка / закрытие вкладки → встроенное предупреждение браузера.
 * Возвращает blocker: proceed() — уйти, reset() — остаться.
 */
export const useUnsavedChanges = (dirty) => {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = ''; // нужно старым браузерам
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return blocker;
};
