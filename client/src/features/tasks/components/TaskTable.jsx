import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ListChecks, Plus } from 'lucide-react';
import { EmptyState, Select, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_KEYS,
  taskPriorityOptions,
  taskStatusOptions,
} from '@/lib/taskMeta';
import { useProjectTasks } from '../hooks/useTasks';
import { AssigneeAvatar, PriorityBadge, StatusDot, TaskDue } from './TaskBits';

// Без срока / без исполнителя — в конце при любом направлении
const compareNullable = (a, b, dir, compare) => {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return compare(a, b) * dir;
};

const COLUMNS = [
  {
    key: 'title',
    label: 'Название',
    compare: (a, b, dir) => a.title.localeCompare(b.title, 'ru') * dir,
  },
  {
    key: 'status',
    label: 'Статус',
    compare: (a, b, dir) =>
      (TASK_STATUS_KEYS.indexOf(a.status) - TASK_STATUS_KEYS.indexOf(b.status)) * dir,
  },
  {
    key: 'priority',
    label: 'Приоритет',
    compare: (a, b, dir) =>
      (TASK_PRIORITIES[a.priority].rank - TASK_PRIORITIES[b.priority].rank) * dir,
  },
  {
    key: 'dueDate',
    label: 'Срок',
    compare: (a, b, dir) =>
      compareNullable(a.dueDate, b.dueDate, dir, (x, y) => x.localeCompare(y)),
  },
  {
    key: 'assignee',
    label: 'Исполнитель',
    compare: (a, b, dir) =>
      compareNullable(a.assignee?.name, b.assignee?.name, dir, (x, y) => x.localeCompare(y, 'ru')),
  },
];

const ariaSort = { 1: 'ascending', '-1': 'descending' };

function SortHeader({ column, sort, onSort }) {
  const active = sort.key === column.key;
  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? ariaSort[sort.dir] : 'none'}
      className="px-3 py-2 text-left font-medium"
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={cn(
          'focus-ring -mx-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-fg',
          active && 'text-fg',
        )}
      >
        {column.label}
        <Icon className={cn('size-3.5', !active && 'opacity-40')} aria-hidden="true" />
      </button>
    </th>
  );
}

/** Вкладка «Задачи»: таблица с сортировкой по столбцам и фильтрами статуса и приоритета. */
export function TaskTable({ projectId, onOpenTask, onAddTask }) {
  const { data: tasks, isPending, error } = useProjectTasks(projectId);
  const [sort, setSort] = useState({ key: 'status', dir: 1 });
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  if (isPending) {
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Не удалось загрузить задачи"
        description={getErrorMessage(error)}
      />
    );
  }

  const toggleSort = (key) =>
    setSort((current) => (current.key === key ? { key, dir: -current.dir } : { key, dir: 1 }));

  const column = COLUMNS.find((c) => c.key === sort.key);
  const rows = tasks
    .filter((t) => (!status || t.status === status) && (!priority || t.priority === priority))
    // Стабильно: при равенстве — порядок на доске
    .toSorted((a, b) => column.compare(a, b, sort.dir) || a.position - b.position);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Задач пока нет"
        description="Добавьте первую на доске — колонка «К работе»."
        action={
          onAddTask && (
            <button
              type="button"
              onClick={onAddTask}
              className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-fg underline underline-offset-4"
            >
              <Plus className="size-4" aria-hidden="true" />
              Перейти к доске
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <Select
          label="Статус"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[{ value: '', label: 'Все статусы' }, ...taskStatusOptions]}
          className="w-44"
        />
        <Select
          label="Приоритет"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={[{ value: '', label: 'Любой' }, ...taskPriorityOptions]}
          className="w-44"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-soft">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">
            Задачи проекта. Сортировка — кнопками в заголовках столбцов.
          </caption>
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              {COLUMNS.map((c) => (
                <SortHeader key={c.key} column={c} sort={sort} onSort={toggleSort} />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((task) => (
              <tr
                key={task.id}
                onClick={() => onOpenTask(task)}
                className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2/60"
              >
                <td className="max-w-80 px-3 py-2.5">
                  {/* Кнопка — чтобы строку можно было открыть с клавиатуры */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTask(task);
                    }}
                    className={cn(
                      'focus-ring line-clamp-2 rounded text-left font-medium text-fg',
                      task.status === 'done' && 'text-muted line-through decoration-muted/50',
                    )}
                  >
                    {task.title}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <span className="inline-flex items-center gap-2 text-fg">
                    <StatusDot status={task.status} />
                    {TASK_STATUSES[task.status].label}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {task.dueDate ? <TaskDue task={task} /> : <span className="text-muted">—</span>}
                </td>
                <td className="px-3 py-2.5">
                  {task.assignee ? (
                    <span className="inline-flex items-center gap-2 text-fg">
                      <AssigneeAvatar assignee={task.assignee} />
                      <span className="truncate">{task.assignee.name}</span>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-10 text-center text-muted">
                  По этим фильтрам задач нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
