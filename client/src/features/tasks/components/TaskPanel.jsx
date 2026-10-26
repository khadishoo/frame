import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { AnimatePresence, m } from 'framer-motion';
import { RotateCw, SearchX, Trash2, X } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  Input,
  SaveStatus,
  Select,
  Skeleton,
  Textarea,
} from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { useProject } from '@/features/projects/hooks/useProjects';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { toast } from '@/lib/toast';
import { taskPriorityOptions, taskStatusOptions } from '@/lib/taskMeta';
import { useDeleteTask, useTask, useUpdateTask } from '../hooks/useTasks';
import { useTaskParam } from '../hooks/useTaskParam';

/**
 * Поля задачи. Текст сохраняется при уходе с поля, выпадающие списки и дата — сразу
 * при выборе. flushRef — сохранить несохранённый текст при закрытии окна (Esc, крестик):
 * удалённое из DOM поле событие blur не получает.
 */
function TaskForm({ task, readOnly, save, flushRef }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [titleError, setTitleError] = useState(null);
  const user = useAuthStore((s) => s.user);

  const commitTitle = () => {
    const value = title.trim();
    if (!value) {
      setTitle(task.title);
      setTitleError('Название не может быть пустым — вернули прежнее');
      return;
    }
    setTitleError(null);
    if (value !== task.title) save({ title: value });
  };

  const commitDescription = () => {
    const value = description.trim();
    if (value !== (task.description ?? '')) save({ description: value });
  };

  useEffect(() => {
    flushRef.current = () => {
      if (title.trim() && title.trim() !== task.title) save({ title: title.trim() });
      commitDescription();
    };
  });

  const assigneeOptions = [
    { value: '', label: 'Не назначен' },
    ...(user ? [{ value: user.id, label: 'Вы' }] : []),
    ...(task.assignee && task.assignee.id !== user?.id
      ? [{ value: task.assignee.id, label: task.assignee.name }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label="Название"
        rows={1}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          // Название — одной строкой: Enter сохраняет
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        maxLength={200}
        error={titleError}
        disabled={readOnly}
        inputClassName="min-h-0 resize-none text-base font-semibold [field-sizing:content]"
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Статус"
          value={task.status}
          options={taskStatusOptions}
          onChange={(e) => save({ status: e.target.value })}
          disabled={readOnly}
        />
        <Select
          label="Приоритет"
          value={task.priority}
          options={taskPriorityOptions}
          onChange={(e) => save({ priority: e.target.value })}
          disabled={readOnly}
        />
        <Input
          label="Срок"
          type="date"
          value={task.dueDate ?? ''}
          onChange={(e) => save({ dueDate: e.target.value || null })}
          disabled={readOnly}
        />
        <Select
          label="Исполнитель"
          value={task.assignee?.id ?? ''}
          options={assigneeOptions}
          onChange={(e) => save({ assigneeId: e.target.value || null })}
          disabled={readOnly}
        />
      </div>

      <Textarea
        label="Описание"
        rows={6}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={commitDescription}
        placeholder={readOnly ? 'Описания нет' : 'Детали, ссылки, заметки…'}
        maxLength={10000}
        disabled={readOnly}
      />

      {task.completedAt && task.status === 'done' && (
        <p className="text-xs text-muted">
          Выполнено {new Date(task.completedAt).toLocaleString('ru-RU', { dateStyle: 'long' })}
        </p>
      )}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Skeleton className="h-36 w-full" />
    </div>
  );
}

function PanelContent({ taskId, onClose }) {
  const panelRef = useRef(null);
  const flushRef = useRef(null);
  const pendingSaves = useRef(0);
  const [saveState, setSaveState] = useState('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const desktop = useMediaQuery('(min-width: 640px)');

  const { data: task, error, isPending, refetch, isRefetching } = useTask(taskId);
  const { data: project } = useProject(task?.projectId);
  const { workspace } = useCurrentWorkspace();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const archived = Boolean(project?.archivedAt);
  const readOnly = !task || archived || workspace?.role === 'viewer' || task.pending;

  useFocusTrap(panelRef, true);
  useLockBodyScroll(true);

  const close = () => {
    if (!readOnly) flushRef.current?.();
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Esc в окне подтверждения закрывает только его
      if (event.key === 'Escape' && !confirmDelete) close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  const save = (data) => {
    pendingSaves.current += 1;
    setSaveState('saving');
    updateTask.mutate(
      { id: task.id, projectId: task.projectId, data },
      {
        onSuccess: () => {
          pendingSaves.current -= 1;
          if (pendingSaves.current === 0) setSaveState('saved');
        },
        onError: (err) => {
          pendingSaves.current -= 1;
          setSaveState('error');
          toast.error('Изменение не сохранилось', { description: getErrorMessage(err) });
        },
      },
    );
  };

  const remove = async () => {
    try {
      await deleteTask.mutateAsync({ id: task.id, projectId: task.projectId });
    } catch (err) {
      toast.error('Задача не удалена', { description: getErrorMessage(err) });
      throw err;
    }
    toast.success('Задача удалена', { description: task.title });
    onClose();
  };

  const type = project ? PROJECT_TYPES[project.type] : null;
  const notFound = error?.response?.status === 404;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end sm:items-stretch">
      <m.div
        className="absolute inset-0 bg-overlay/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={close}
        aria-hidden="true"
      />
      <m.aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={task ? `Задача: ${task.title}` : 'Задача'}
        tabIndex={-1}
        className={cn(
          'relative flex w-full flex-col border-border bg-surface shadow-pop outline-none',
          // Телефон — шторка снизу; от 640 px — панель справа на всю высоту
          'max-h-[90dvh] rounded-t-xl border-t sm:max-h-none sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0',
        )}
        initial={desktop ? { x: '100%' } : { y: '100%' }}
        animate={desktop ? { x: 0 } : { y: 0 }}
        exit={desktop ? { x: '100%' } : { y: '100%' }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden"
          aria-hidden="true"
        />
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {project ? (
              <Link
                to={`/app/projects/${project.id}?tab=board`}
                onClick={() => flushRef.current?.()}
                className="focus-ring flex min-w-0 items-center gap-1.5 rounded text-xs text-muted hover:text-fg"
              >
                <span className={cn('size-2 shrink-0 rounded-full', type.dot)} aria-hidden="true" />
                <span className="truncate">{project.title}</span>
              </Link>
            ) : (
              <span className="text-xs text-muted">Задача</span>
            )}
            <SaveStatus state={saveState} />
          </div>
          <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Закрыть задачу">
            <X />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {archived && (
            <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
              Проект в архиве — задачу можно только просматривать.
            </p>
          )}
          {task ? (
            <TaskForm
              key={task.id}
              task={task}
              readOnly={readOnly}
              save={save}
              flushRef={flushRef}
            />
          ) : notFound || (!isPending && error) ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <SearchX className="size-8 text-muted" aria-hidden="true" />
              <p className="font-medium text-fg">
                {notFound ? 'Задача не найдена' : 'Не удалось загрузить задачу'}
              </p>
              <p className="text-sm text-muted">
                {notFound
                  ? 'Возможно, её удалили или ссылка ведёт в чужое пространство.'
                  : getErrorMessage(error)}
              </p>
              {!notFound && (
                <Button
                  variant="secondary"
                  leftIcon={<RotateCw />}
                  loading={isRefetching}
                  onClick={() => refetch()}
                >
                  Повторить
                </Button>
              )}
            </div>
          ) : (
            <PanelSkeleton />
          )}
        </div>

        {task && !readOnly && (
          <footer className="flex justify-between border-t border-border px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <Button
              variant="ghost"
              leftIcon={<Trash2 />}
              className="text-danger hover:bg-danger/10"
              onClick={() => setConfirmDelete(true)}
            >
              Удалить
            </Button>
            <Button variant="secondary" onClick={close}>
              Готово
            </Button>
          </footer>
        )}
      </m.aside>

      {task && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={remove}
          danger
          title="Удалить задачу?"
          description={`«${task.title}» исчезнет без возможности восстановления.`}
          confirmText="Удалить"
        />
      )}
    </div>
  );
}

/** Окно задачи — одно на приложение (в AppLayout); открывается по ?task=<id>. */
export function TaskPanel() {
  const { taskId, closeTask } = useTaskParam();
  return createPortal(
    <AnimatePresence>
      {taskId && <PanelContent key={taskId} taskId={taskId} onClose={closeTask} />}
    </AnimatePresence>,
    document.body,
  );
}
