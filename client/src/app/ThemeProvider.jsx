import { useEffect } from 'react';
import { subscribeToSystemTheme, useThemeStore } from '@/lib/theme';

/**
 * Следит за системной темой: если выбран режим «как в системе»,
 * интерфейс переключается вместе с настройками ОС без перезагрузки.
 */
export function ThemeProvider({ children }) {
  const syncWithSystem = useThemeStore((state) => state.syncWithSystem);

  useEffect(() => subscribeToSystemTheme(syncWithSystem), [syncWithSystem]);

  return children;
}
