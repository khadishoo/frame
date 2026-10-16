import { create } from 'zustand';

export const THEME_STORAGE_KEY = 'frame-theme';
export const THEMES = ['light', 'dark', 'system'];

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

const readPreference = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
};

export const resolveTheme = (preference) =>
  preference === 'system' ? (darkQuery().matches ? 'dark' : 'light') : preference;

/** Ставит класс .dark на <html>. withTransition — плавная смена цветов на 250 мс. */
export const applyTheme = (resolved, { withTransition = false } = {}) => {
  const root = document.documentElement;
  if (withTransition) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 250);
  }
  root.classList.toggle('dark', resolved === 'dark');
};

/**
 * Глобальное состояние темы.
 * preference — выбор пользователя ('light' | 'dark' | 'system'),
 * resolved — что реально показано ('light' | 'dark').
 * Начальный класс на <html> ставит инлайн-скрипт в index.html.
 */
export const useThemeStore = create((set) => {
  const preference = readPreference();

  return {
    preference,
    resolved: resolveTheme(preference),

    setPreference: (next) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // localStorage недоступен (приватный режим) — тема просто не запомнится
      }
      const resolved = resolveTheme(next);
      applyTheme(resolved, { withTransition: true });
      set({ preference: next, resolved });
    },

    // Вызывается ThemeProvider при смене системной темы
    syncWithSystem: () => {
      set((state) => {
        if (state.preference !== 'system') return state;
        const resolved = resolveTheme('system');
        applyTheme(resolved, { withTransition: true });
        return { resolved };
      });
    },
  };
});

export const subscribeToSystemTheme = (callback) => {
  const query = darkQuery();
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
};
