import { useSyncExternalStore } from 'react';

/** true, пока выполняется медиазапрос: useMediaQuery('(min-width: 640px)') */
export const useMediaQuery = (query) =>
  useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
