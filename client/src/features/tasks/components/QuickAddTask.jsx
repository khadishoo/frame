import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { toast } from '@/lib/toast';
import { TASK_STATUSES } from '@/lib/taskMeta';
import { useCreateTask } from '../hooks/useTasks';

/**
 * Быстрое добавление внизу колонки. Enter — создать и остаться в поле для следующей,
 * Esc — отмена. Пустое поле при уходе фокуса закрывается само.
 */
export function QuickAddTask({ projectId, status }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const buttonRef = useRef(null);
  const createTask = useCreateTask(projectId);
  const columnLabel = TASK_STATUSES[status].label;

  const close = ({ focusButton = true } = {}) => {
    setOpen(false);
    setTitle('');
    // Кнопка появится после рендера — фокус переводим в следующем кадре
    if (focusButton) requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const submit = () => {
    const value = title.trim();
    if (!value) return;
    setTitle(''); // поле сразу пустое — можно печатать следующую
    createTask.mutate(
      { title: value, status },
      {
        onError: (error) => {
          toast.error('Задача не создана', { description: getErrorMessage(error) });
          // Возвращаем текст, если пользователь ещё ничего не начал печатать заново
          setTitle((current) => current || value);
        },
      },
    );
  };

  if (!open) {
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex h-9 w-full items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <Plus className="size-4" aria-hidden="true" />
        Добавить задачу
      </button>
    );
  }

  return (
    <input
      // Поле появляется по нажатию кнопки — фокус сразу в нём
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
      }}
      onBlur={() => {
        if (!title.trim()) close({ focusButton: false });
      }}
      maxLength={200}
      placeholder="Название и Enter"
      aria-label={`Новая задача в колонке «${columnLabel}»`}
      className="focus-ring h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg shadow-soft placeholder:text-muted"
    />
  );
}
