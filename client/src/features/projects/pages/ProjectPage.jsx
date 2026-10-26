import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Activity,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarDays,
  Ellipsis,
  Files,
  Kanban,
  LayoutGrid,
  ListChecks,
  Pencil,
  StickyNote,
  Trash2,
} from 'lucide-react';
import {
  Alert,
  Button,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  ProgressRing,
  Skeleton,
  Tabs,
  buttonVariants,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { describeDue, formatDate } from '@/lib/dates';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { statusOptions } from '@/lib/projectStatuses';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { toast } from '@/lib/toast';
import { DueDate, LabelChip, StatusBadge } from '../components/ProjectBits';
import {
  useArchiveProject,
  useDeleteProject,
  useProject,
  useRestoreProject,
  useUpdateProject,
} from '../hooks/useProjects';
import { BoardView } from '@/features/tasks/components/BoardView';
import { TaskTable } from '@/features/tasks/components/TaskTable';
import { useTaskParam } from '@/features/tasks/hooks/useTaskParam';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { useProjectModal } from '../projectModalStore';

const BackLink = () => (
  <Link
    to="/app/projects"
    className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-fg"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    Проекты
  </Link>
);

/** «Пустой кадр» для несуществующего или чужого проекта. */
function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <title>Проект не найден · Frame</title>
      <div className="relative flex h-32 w-48 items-center justify-center">
        <svg
          className="absolute inset-0 size-full text-muted/40"
          viewBox="0 0 192 128"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 26V12A10 10 0 0 1 12 2h14M166 2h14a10 10 0 0 1 10 10v14M190 102v14a10 10 0 0 1-10 10h-14M26 126H12A10 10 0 0 1 2 116v-14"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-display text-xl font-semibold text-muted">пусто</span>
      </div>
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-xl font-semibold text-fg">Проект не найден</h1>
        <p className="text-sm text-muted">
          Возможно, его удалили или ссылка ведёт в чужое пространство.
        </p>
      </div>
      <Link to="/app/projects" className={buttonVariants()}>
        Ко всем проектам
      </Link>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="mt-6 h-10 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm text-fg">{children}</span>
      </div>
    </div>
  );
}

function OverviewTab({ project }) {
  const type = PROJECT_TYPES[project.type];
  const due = describeDue(project.dueDate, { completed: project.status === 'completed' });
  const { done, total } = project.taskCounts;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="rounded-xl border border-border bg-surface p-5 shadow-soft">
        <h2 className="mb-3 text-base font-semibold text-fg">Описание</h2>
        {project.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg/90">
            {project.description}
          </p>
        ) : (
          <p className="text-sm text-muted">
            Описания пока нет — добавьте его через «Редактировать».
          </p>
        )}
      </section>

      <aside className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={project.progress}
            size="lg"
            label={`Прогресс проекта: ${project.progress}%`}
            className={type.text}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-fg">Прогресс</span>
            <span className="text-xs text-muted">
              {total > 0
                ? `${done} из ${total} задач готово`
                : 'Задач пока нет — добавьте их на доске'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <InfoRow icon={CalendarDays} label="Начало">
            {project.startDate ? formatDate(project.startDate) : '—'}
          </InfoRow>
          <InfoRow icon={CalendarDays} label="Дедлайн">
            {project.dueDate ? (
              <span className="flex flex-wrap items-center gap-x-2">
                {formatDate(project.dueDate)}
                {due && due.tone !== 'normal' && due.tone !== 'done' && (
                  <DueDate project={project} />
                )}
              </span>
            ) : (
              '—'
            )}
          </InfoRow>
        </div>
        <p className="border-t border-border pt-4 text-xs text-muted">
          Создан {new Date(project.createdAt).toLocaleDateString('ru-RU')} · изменён{' '}
          {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
        </p>
      </aside>
    </div>
  );
}

/** Плашка над доской и таблицей: почему нельзя ничего менять. */
function ReadOnlyNote({ archived }) {
  return (
    <p className="mb-3 flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
      <Archive className="size-4 shrink-0" aria-hidden="true" />
      {archived
        ? 'Проект в архиве — доска только для просмотра. Восстановите проект, чтобы менять задачи.'
        : 'У вас роль «наблюдатель» — задачи только для просмотра.'}
    </p>
  );
}

const TAB_VALUES = ['overview', 'board', 'tasks', 'files', 'notes', 'activity'];

const stubTabs = [
  { value: 'files', label: 'Файлы', icon: Files, stage: '12 (v1.1)' },
  { value: 'notes', label: 'Заметки', icon: StickyNote, stage: 8 },
  { value: 'activity', label: 'Активность', icon: Activity, stage: '14 (v1.3)' },
];

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isPending, error } = useProject(id);
  const openEdit = useProjectModal((s) => s.openEdit);
  const updateProject = useUpdateProject();
  const archiveProject = useArchiveProject();
  const restoreProject = useRestoreProject();
  const deleteProject = useDeleteProject();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [params, setParams] = useSearchParams();
  const { openTask } = useTaskParam();
  const { workspace } = useCurrentWorkspace();

  // Вкладка — в адресе (?tab=board): после F5 и по ссылке открывается та же
  const tab = TAB_VALUES.includes(params.get('tab')) ? params.get('tab') : 'overview';
  const changeTab = (value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'overview') next.delete('tab');
        else next.set('tab', value);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );

  if (isPending) return <ProjectSkeleton />;
  if (error?.response?.status === 404) return <ProjectNotFound />;
  if (error) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Не удалось открыть проект"
        description={getErrorMessage(error)}
        action={<BackLink />}
      />
    );
  }

  const type = PROJECT_TYPES[project.type];
  const TypeIcon = type.icon;
  const archived = Boolean(project.archivedAt);
  const readOnly = archived || workspace?.role === 'viewer';
  const openTaskCard = (task) => openTask(task.id);

  const changeStatus = (status) =>
    updateProject.mutate(
      { id: project.id, data: { status } },
      {
        onError: (err) => toast.error('Статус не изменился', { description: getErrorMessage(err) }),
      },
    );

  const toggleArchive = () => {
    const mutation = archived ? restoreProject : archiveProject;
    mutation.mutate(project.id, {
      onSuccess: () => toast.success(archived ? 'Проект восстановлен' : 'Проект в архиве'),
      onError: (err) => toast.error('Не получилось', { description: getErrorMessage(err) }),
    });
  };

  const remove = async () => {
    await deleteProject.mutateAsync(project.id);
    toast.success('Проект удалён', { description: project.title });
    navigate('/app/projects', { replace: true });
  };

  return (
    <>
      <title>{`${project.title} · Frame`}</title>
      <BackLink />

      {archived && (
        <Alert variant="info" className="mb-4">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            Проект в архиве — его не видно в общем списке.
            <button
              type="button"
              onClick={toggleArchive}
              className="focus-ring rounded font-medium text-fg underline underline-offset-4"
            >
              Восстановить
            </button>
          </span>
        </Alert>
      )}

      <header className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-fg',
              type.soft,
            )}
          >
            <TypeIcon className={cn('size-3.5', type.text)} aria-hidden="true" />
            {type.label}
          </span>
          {project.category && <LabelChip label={project.category} kind="category" />}
          {project.tags.map((tag) => (
            <LabelChip key={tag.id} label={tag} />
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-xl font-semibold text-fg sm:text-2xl">{project.title}</h1>

          <div className="flex shrink-0 items-center gap-2">
            {archived ? (
              <StatusBadge project={project} />
            ) : (
              <label className="relative">
                <span className="sr-only">Статус проекта</span>
                <select
                  value={project.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  className="focus-ring h-9 cursor-pointer appearance-none rounded-lg border border-border bg-surface pl-3 pr-8 text-sm font-medium text-fg shadow-soft hover:bg-surface-2"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  ▾
                </span>
              </label>
            )}
            <Button variant="secondary" leftIcon={<Pencil />} onClick={() => openEdit(project)}>
              <span className="hidden xs:inline">Редактировать</span>
            </Button>
            <Dropdown
              trigger={
                <Button variant="secondary" size="icon" aria-label="Ещё действия">
                  <Ellipsis />
                </Button>
              }
              items={[
                { label: 'Редактировать', icon: Pencil, onSelect: () => openEdit(project) },
                archived
                  ? { label: 'Восстановить', icon: ArchiveRestore, onSelect: toggleArchive }
                  : { label: 'В архив', icon: Archive, onSelect: toggleArchive },
                { type: 'separator' },
                {
                  label: 'Удалить',
                  icon: Trash2,
                  danger: true,
                  onSelect: () => setConfirmDelete(true),
                },
              ]}
            />
          </div>
        </div>
      </header>

      <Tabs
        label="Разделы проекта"
        value={tab}
        onValueChange={changeTab}
        items={[
          {
            value: 'overview',
            label: 'Обзор',
            icon: LayoutGrid,
            content: <OverviewTab project={project} />,
          },
          {
            value: 'board',
            label: 'Доска',
            icon: Kanban,
            count: project.taskCounts.total,
            content: (
              <>
                {readOnly && <ReadOnlyNote archived={archived} />}
                <BoardView projectId={project.id} readOnly={readOnly} onOpenTask={openTaskCard} />
              </>
            ),
          },
          {
            value: 'tasks',
            label: 'Задачи',
            icon: ListChecks,
            content: (
              <>
                {readOnly && <ReadOnlyNote archived={archived} />}
                <TaskTable
                  projectId={project.id}
                  onOpenTask={openTaskCard}
                  onAddTask={readOnly ? undefined : () => changeTab('board')}
                />
              </>
            ),
          },
          ...stubTabs.map((tab) => ({
            ...tab,
            content: (
              <EmptyState
                icon={tab.icon}
                title={`Вкладка «${tab.label}»`}
                description={`Появится на этапе ${tab.stage}.`}
              />
            ),
          })),
        ]}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        danger
        title="Удалить проект?"
        description={`«${project.title}» исчезнет вместе с задачами и заметками. Если просто хотите убрать его с глаз — отправьте в архив.`}
        confirmText="Удалить"
      />
    </>
  );
}
