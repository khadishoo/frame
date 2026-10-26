import { create } from 'zustand';

/**
 * Окно «Быстрая идея» — одно на приложение (в AppLayout). Открывается клавишей N,
 * пунктом «Идею» в «+ Создать» и кнопками на страницах. projectId — сразу привязать к проекту.
 */
export const useQuickIdea = create((set) => ({
  open: false,
  projectId: null,
  openQuickIdea: ({ projectId = null } = {}) => set({ open: true, projectId }),
  close: () => set({ open: false }),
}));

/** Фокус в поле ввода — горячие клавиши не перехватываем (человек печатает). */
export const isTypingTarget = (element) =>
  Boolean(
    element &&
    (element.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName) ||
      element.closest?.('[contenteditable="true"]')),
  );

/**
 * Нажатие — «быстрая идея»? Смотрим event.code (физическая клавиша), а не event.key:
 * в русской раскладке на той же клавише буква «т», а работать должно в любой.
 */
export const isQuickIdeaHotkey = (event) =>
  event.code === 'KeyN' &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.altKey &&
  !event.repeat &&
  !isTypingTarget(event.target) &&
  // Открыто модальное окно (своя клавиатура) — не мешаем
  !document.querySelector('[aria-modal="true"]');
