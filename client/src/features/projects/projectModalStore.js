import { create } from 'zustand';

/**
 * Окно создания/редактирования проекта — одно на всё приложение (рисуется в AppLayout),
 * открыть его можно откуда угодно: топбар, дашборд, страница проекта.
 * project: null — создание, объект — редактирование.
 */
export const useProjectModal = create((set) => ({
  open: false,
  project: null,
  openCreate: () => set({ open: true, project: null }),
  openEdit: (project) => set({ open: true, project }),
  close: () => set({ open: false }),
}));
