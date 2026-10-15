import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'frame-theme';

// Начальное значение уже выставлено скриптом в index.html — читаем его с <html>
const getInitialTheme = () =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

/**
 * Простое управление темой. На этапе 3 переедет в ThemeProvider (Zustand)
 * и будет синхронизироваться с профилем пользователя.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage может быть недоступен (приватный режим) — тема просто не запомнится
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
};
