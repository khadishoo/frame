import { create } from 'zustand';

const DEFAULT_DURATION = 4000;
let nextId = 0;

/** Очередь уведомлений. Отрисовывает их компонент <Toaster /> (components/ui/Toast.jsx). */
export const useToastStore = create((set) => ({
  toasts: [],
  add: (toast) => set((state) => ({ toasts: [...state.toasts, toast].slice(-4) })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

const show = (variant, title, options = {}) => {
  const id = ++nextId;
  const { description, action, duration = DEFAULT_DURATION } = options;
  useToastStore.getState().add({ id, variant, title, description, action, duration });
  return id;
};

/**
 * Показать уведомление из любого места (не только из компонентов):
 * toast.success('Проект создан'); toast.error('Не удалось сохранить', { description: '…' })
 * action — кнопка в уведомлении: { label: 'Открыть', onClick }
 */
export const toast = {
  success: (title, options) => show('success', title, options),
  error: (title, options) => show('error', title, options),
  warning: (title, options) => show('warning', title, options),
  info: (title, options) => show('info', title, options),
  dismiss: (id) => useToastStore.getState().dismiss(id),
};
