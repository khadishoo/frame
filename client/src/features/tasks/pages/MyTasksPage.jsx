import { Link } from 'react-router';
import { AnimatePresence, LayoutGroup, m } from 'framer-motion';
import { ListChecks, PartyPopper } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Checkbox, EmptyState, ErrorState, Skeleton, buttonVariants } from '@/components/ui';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { plural } from '@/lib/dates';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { toast } from '@/lib/toast';
import { PriorityBadge, TaskDue } from '../components/TaskBits';
import { useMyTasks, useUpdateTask } from '../hooks/useTasks';
import { useTaskParam } from '../hooks/useTaskParam';
import { groupMyTasks } from '../myTasks';

const MY_TASKS_FILTERS = { assignee: 'me' };

function MyTaskItem({ task, readOnly, onToggle, onOpen }) {
  const done = task.status === 'done';
  const type = PROJECT_TYPES[task.project?.type] ?? PROJECT_TYPES.other;
  return (
    <m.li
      layout="position"
      layoutId={task.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-soft"
    >
      <Checkbox
        checked={done}
        onChange={() => onToggle(task)}
        disabled={readOnly}
        aria-label={
          done ? `Вернуть в работу: ${task.title}` : `Отметить выполненной: ${task.title}`
        }
        className="pt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onOpen(task)}
          className={cn(
            'focus-ring w-fit rounded text-left text-sm font-medium text-fg hover:underline hover:underline-offset-4',
            done && 'text-muted line-through decoration-muted/50',
          )}
        >
          {task.title}
        </button>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {task.project && (
            <Link
              to={`/app/projects/${task.project.id}?tab=board`}
              className="focus-ring inline-flex min-w-0 items-center gap-1.5 rounded text-xs text-muted hover:text-fg"
            >
              <span className={cn('size-2 shrink-0 rounded-full', type.dot)} aria-hidden="true" />
              <span className="max-w-48 truncate">{task.project.title}</span>
            </Link>
          )}
          <PriorityBadge priority={task.priority} />
          <TaskDue task={task} />
        </div>
      </div>
    </m.li>
  );
}

function MyTasksSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {[3, 2].map((rows, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: rows }, (_, j) => (
            <Skeleton key={j} className="h-16" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** «Мои задачи»: всё, где я исполнитель, по срокам — во всех проектах пространства. */
export default function MyTasksPage() {
  const { data: tasks, isPending, error, refetch, isRefetching } = useMyTasks(MY_TASKS_FILTERS);
  const { openTask } = useTaskParam();
  const updateTask = useUpdateTask();
  const { workspace } = useCurrentWorkspace();
  const readOnly = workspace?.role === 'viewer';

  const toggle = (task) =>
    updateTask.mutate(
      {
        id: task.id,
        projectId: task.projectId,
        data: { status: task.status === 'done' ? 'todo' : 'done' },
      },
      {
        onError: (err) =>
          toast.error('Не удалось отметить задачу', { description: getErrorMessage(err) }),
      },
    );

  const groups = tasks ? groupMyTasks(tasks) : [];
  const overdue = groups.find((g) => g.key === 'overdue')?.tasks.length ?? 0;
  const today = groups.find((g) => g.key === 'today')?.tasks.length ?? 0;
  const summary =
    overdue || today
      ? [
          overdue && `${overdue} ${plural(overdue, ['просрочена', 'просрочены', 'просрочено'])}`,
          today && `${today} на сегодня`,
        ]
          .filter(Boolean)
          .join(' · ')
      : 'Задачи, где вы исполнитель, — во всех проектах.';

  let content;
  if (isPending) {
    content = <MyTasksSkeleton />;
  } else if (error) {
    content = (
      <ErrorState
        title="Не удалось загрузить задачи"
        error={error}
        onRetry={refetch}
        retrying={isRefetching}
      />
    );
  } else if (groups.length === 0) {
    content = (
      <EmptyState
        icon={tasks.length ? PartyPopper : ListChecks}
        title={tasks.length ? 'Всё сделано' : 'Задач пока нет'}
        description={
          tasks.length
            ? 'Открытых задач нет — можно взяться за новый проект.'
            : 'Здесь появятся задачи, где вы исполнитель. Создайте их на доске проекта.'
        }
        action={
          <Link to="/app/projects" className={buttonVariants({ variant: 'secondary' })}>
            К проектам
          </Link>
        }
      />
    );
  } else {
    content = (
      <LayoutGroup>
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`my-tasks-${group.key}`}>
              <h2
                id={`my-tasks-${group.key}`}
                className={cn(
                  'mb-2 flex items-center gap-2 text-sm font-semibold',
                  group.key === 'overdue' ? 'text-danger' : 'text-fg',
                )}
              >
                {group.label}
                <span className="rounded-full bg-surface-2 px-1.5 text-xs font-medium tabular-nums text-muted">
                  {group.tasks.length}
                </span>
              </h2>
              <ul className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {group.tasks.map((task) => (
                    <MyTaskItem
                      key={task.id}
                      task={task}
                      readOnly={readOnly}
                      onToggle={toggle}
                      onOpen={(t) => openTask(t.id)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      </LayoutGroup>
    );
  }

  return (
    <>
      <PageHeader title="Мои задачи" description={summary} />
      {content}
    </>
  );
}
