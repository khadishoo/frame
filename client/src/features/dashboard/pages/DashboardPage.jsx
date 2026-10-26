import { Link } from 'react-router';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CircleAlert,
  FolderKanban,
  Lightbulb,
  ListChecks,
  ListTodo,
  Rocket,
} from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, EmptyState, Skeleton, buttonVariants } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { NoteCard } from '@/features/notes/components/NoteCard';
import { useQuickIdea } from '@/features/notes/quickIdeaStore';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useProjectModal } from '@/features/projects/projectModalStore';
import { PriorityBadge, TaskDue } from '@/features/tasks/components/TaskBits';
import { useTaskParam } from '@/features/tasks/hooks/useTaskParam';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { plural } from '@/lib/dates';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { ActivityChart } from '../components/ActivityChart';
import { greetingText } from '../greeting';
import { useDashboard } from '../hooks/useDashboard';

const STATS = [
  {
    key: 'activeProjects',
    label: 'Активные проекты',
    icon: FolderKanban,
    to: '/app/projects?status=active',
  },
  { key: 'tasksInProgress', label: 'Задачи в работе', icon: ListTodo, to: '/app/tasks' },
  { key: 'completedThisWeek', label: 'Выполнено за 7 дней', icon: Check, to: '/app/tasks' },
  { key: 'overdue', label: 'Просрочено', icon: CircleAlert, to: '/app/tasks', alert: true },
];

/** Карточка-цифра; вся карточка — ссылка в нужный список. Просрочки > 0 — с акцентом. */
function StatCard({ stat, value }) {
  const Icon = stat.icon;
  const alarm = stat.alert && value > 0;
  return (
    <Link
      to={stat.to}
      className={cn(
        'focus-ring group flex flex-col gap-3 rounded-xl border p-4 shadow-soft transition-[box-shadow,transform] duration-200 hover:shadow-pop motion-safe:hover:-translate-y-0.5',
        alarm ? 'border-danger/40 bg-danger/5' : 'border-border bg-surface',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted">{stat.label}</span>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            alarm ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-muted',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </span>
      <span
        className={cn(
          'font-display text-2xl font-semibold tabular-nums',
          alarm ? 'text-danger' : 'text-fg',
        )}
      >
        {value}
      </span>
    </Link>
  );
}

function Widget({ title, action, children, className }) {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-soft sm:p-5',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const AllLink = ({ to, children = 'Все' }) => (
  <Link
    to={to}
    className="focus-ring inline-flex items-center gap-1 rounded text-sm text-muted hover:text-fg"
  >
    {children}
    <ArrowRight className="size-3.5" aria-hidden="true" />
  </Link>
);

function UpcomingTasks({ tasks }) {
  const { openTask } = useTaskParam();
  if (tasks.length === 0) {
    return <p className="text-sm text-muted">Ближайших дедлайнов нет — можно выдохнуть.</p>;
  }
  return (
    <ul className="-mx-2 flex flex-col">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => openTask(task.id)}
            className="focus-ring flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2/70"
          >
            <span className="line-clamp-1 text-sm font-medium text-fg">{task.title}</span>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    PROJECT_TYPES[task.project.type].dot,
                  )}
                  aria-hidden="true"
                />
                <span className="max-w-40 truncate">{task.project.title}</span>
              </span>
              <TaskDue task={task} />
              {['high', 'urgent'].includes(task.priority) && (
                <PriorityBadge priority={task.priority} />
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Первые шаги нового пользователя. full — ничего ещё нет (виджеты не показываем вовсе);
 * иначе — компактная плашка, пока не пройдены все три шага.
 */
function Onboarding({ totals, firstProject, full }) {
  const openCreateProject = useProjectModal((s) => s.openCreate);
  const openQuickIdea = useQuickIdea((s) => s.openQuickIdea);

  const steps = [
    {
      title: 'Создайте проект',
      text: 'Альбом, комикс, сайт — у каждого свой цвет и иконка.',
      icon: FolderKanban,
      done: totals.projects > 0,
      action: <Button onClick={openCreateProject}>Создать проект</Button>,
    },
    {
      title: 'Добавьте задачи',
      text: 'Разбейте проект на шаги и двигайте их по доске.',
      icon: ListChecks,
      done: totals.tasks > 0,
      action: firstProject ? (
        <Link
          to={`/app/projects/${firstProject.id}?tab=board`}
          className={buttonVariants({ variant: 'secondary' })}
        >
          Открыть доску
        </Link>
      ) : (
        <span className="text-xs text-muted">Сначала создайте проект</span>
      ),
    },
    {
      title: 'Запишите идею',
      text: 'Мысль, сюжет, референс. Клавиша N — из любого места.',
      icon: Lightbulb,
      done: totals.notes > 0,
      action: (
        <Button variant="secondary" onClick={() => openQuickIdea()}>
          Записать идею
        </Button>
      ),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section
      aria-labelledby="onboarding-title"
      className={cn(
        'rounded-xl border border-border bg-surface shadow-soft',
        full ? 'bg-grain p-6 sm:p-8' : 'mb-6 p-4 sm:p-5',
      )}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="onboarding-title"
          className="flex items-center gap-2 text-base font-semibold text-fg"
        >
          <Rocket className="size-4 text-muted" aria-hidden="true" />
          {full ? 'Начнём? Три шага — и Frame оживёт' : 'Первые шаги'}
        </h2>
        <span className="text-sm text-muted">
          {doneCount} из {steps.length}
        </span>
      </div>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className={cn(
                'flex flex-col gap-3 rounded-lg border p-4',
                step.done ? 'border-success/30 bg-success/5' : 'border-border bg-bg',
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    step.done ? 'bg-success text-accent-fg' : 'bg-surface-2 text-fg',
                  )}
                >
                  {step.done ? <Check className="size-4" aria-label="Готово" /> : index + 1}
                </span>
                <span className="flex items-center gap-1.5 font-medium text-fg">
                  <Icon className="size-4 text-muted" aria-hidden="true" />
                  {step.title}
                </span>
              </span>
              <p className="text-sm text-muted">{step.text}</p>
              {!step.done && <div className="mt-auto">{step.action}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const name = useAuthStore((s) => s.user?.name);
  const { data, isPending, error } = useDashboard();

  let content;
  if (isPending) content = <DashboardSkeleton />;
  else if (error) {
    content = (
      <EmptyState
        icon={FolderKanban}
        title="Не удалось загрузить сводку"
        description={getErrorMessage(error)}
      />
    );
  } else {
    const { stats, totals, activity, today, recentProjects, upcomingTasks, recentNotes } = data;
    const isNew = totals.projects === 0 && totals.tasks === 0 && totals.notes === 0;
    const onboardingLeft = totals.projects === 0 || totals.tasks === 0 || totals.notes === 0;

    content = isNew ? (
      <Onboarding totals={totals} full />
    ) : (
      <div className="flex flex-col gap-6">
        {onboardingLeft && <Onboarding totals={totals} firstProject={recentProjects[0]} />}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STATS.map((stat) => (
            <StatCard key={stat.key} stat={stat} value={stats[stat.key]} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Widget
            title="Скоро дедлайн"
            action={<AllLink to="/app/tasks">Мои задачи</AllLink>}
            className="lg:col-span-2"
          >
            <UpcomingTasks tasks={upcomingTasks} />
          </Widget>
          <Widget
            title="Выполнено за неделю"
            action={
              <span className="text-sm tabular-nums text-muted">
                {stats.completedThisWeek}{' '}
                {plural(stats.completedThisWeek, ['задача', 'задачи', 'задач'])}
              </span>
            }
          >
            <ActivityChart days={activity} today={today} />
          </Widget>
        </div>

        {recentProjects.length > 0 && (
          <section className="flex flex-col gap-3">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-fg">Продолжить работу</h2>
              <AllLink to="/app/projects">Все проекты</AllLink>
            </header>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <header className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
              <Lightbulb className="size-4 text-muted" aria-hidden="true" />
              Свежие идеи
            </h2>
            <AllLink to="/app/ideas">Все идеи</AllLink>
          </header>
          {recentNotes.length > 0 ? (
            <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recentNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Идей пока нет — нажмите <kbd className="rounded border border-border px-1">N</kbd>,
              чтобы записать первую.
            </p>
          )}
        </section>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={greetingText(name)}
        description={
          data && !isPending && data.stats.overdue > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-4 text-danger" aria-hidden="true" />
              {data.stats.overdue}{' '}
              {plural(data.stats.overdue, [
                'задача просрочена',
                'задачи просрочены',
                'задач просрочено',
              ])}{' '}
              — загляните в «Мои задачи».
            </span>
          ) : data?.totals.projects === 0 && data?.totals.notes === 0 ? (
            'Добро пожаловать во Frame — место для ваших творческих проектов.'
          ) : (
            'Вот что происходит в ваших проектах.'
          )
        }
      />
      {content}
    </>
  );
}
