import { Link } from 'react-router';
import { ProgressRing } from '@/components/ui';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { cn } from '@/lib/cn';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { DueDate, LabelChip, StatusBadge, TagList } from './ProjectBits';

// Обложка-градиент в цвете типа (настоящие обложки — в v1.1). Классы целиком для Tailwind
const covers = {
  art: 'from-type-art/30 via-type-art/10',
  music: 'from-type-music/30 via-type-music/10',
  video: 'from-type-video/30 via-type-video/10',
  photo: 'from-type-photo/30 via-type-photo/10',
  script: 'from-type-script/30 via-type-script/10',
  dev: 'from-type-dev/30 via-type-dev/10',
  other: 'from-type-other/30 via-type-other/10',
};

const progressLabel = (project) =>
  `Прогресс: ${project.progress}% (${project.taskCounts.done} из ${project.taskCounts.total} задач)`;

/**
 * Карточка проекта для сетки. Вся карточка — ссылка на страницу проекта; звёздочка лежит
 * поверх, но в разметке — рядом со ссылкой (кнопка внутри ссылки — некорректный HTML).
 */
export function ProjectCard({ project }) {
  const type = PROJECT_TYPES[project.type];
  const Icon = type.icon;

  return (
    <div className="group/card relative flex">
      <Link
        to={`/app/projects/${project.id}`}
        className={cn(
          'focus-ring group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-soft',
          'transition-[transform,box-shadow,border-color] duration-200 hover:border-muted/30 hover:shadow-pop motion-safe:hover:-translate-y-0.5',
          project.archivedAt && 'opacity-75',
        )}
      >
        {/* Полоска типа */}
        <span className={cn('absolute inset-x-0 top-0 h-1', type.dot)} aria-hidden="true" />

        {/* Обложка-градиент с иконкой типа */}
        <div
          className={cn(
            'relative flex h-24 items-end justify-between bg-gradient-to-br to-transparent px-4 pb-3',
            covers[project.type],
          )}
        >
          <span
            className="flex size-10 items-center justify-center rounded-xl bg-surface shadow-soft transition-transform duration-200 motion-safe:group-hover:scale-105"
            title={type.label}
          >
            <Icon className={cn('size-5', type.text)} aria-hidden="true" />
          </span>
          <StatusBadge project={project} className="bg-surface/80 backdrop-blur-sm" />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
          <div className="flex flex-col gap-1.5">
            <h3 className="line-clamp-2 font-sans text-base font-semibold leading-snug text-fg">
              {project.title}
            </h3>
            <p className="text-xs text-muted">
              {type.label}
              {project.category && ' · '}
              {project.category && <span className="text-fg/80">{project.category.name}</span>}
            </p>
          </div>

          <TagList tags={project.tags} />

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
            <DueDate project={project} />
            <ProgressRing
              value={project.progress}
              label={progressLabel(project)}
              className={cn('ml-auto', type.text)}
            />
          </div>
        </div>
      </Link>
      <FavoriteButton
        type="project"
        item={project}
        size="sm"
        className={cn(
          'absolute right-2.5 top-3 bg-surface/70 backdrop-blur-sm transition-[opacity,transform] duration-200 motion-safe:group-hover/card:-translate-y-0.5',
          // Не в избранном — на устройствах с мышью звёздочка видна при наведении или фокусе,
          // чтобы не шуметь в сетке; на сенсорных (наведения нет) — всегда
          !project.isFavorite &&
            '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover/card:opacity-100',
        )}
      />
    </div>
  );
}

/** Компактная строка для вида «Список». */
export function ProjectRow({ project }) {
  const type = PROJECT_TYPES[project.type];
  const Icon = type.icon;

  return (
    <Link
      to={`/app/projects/${project.id}`}
      className={cn(
        'focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2/70 sm:gap-4',
        project.archivedAt && 'opacity-75',
      )}
    >
      <span
        className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', type.soft)}
      >
        <Icon className={cn('size-4', type.text)} aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-fg">{project.title}</span>
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{type.label}</span>
          <DueDate project={project} className="sm:hidden" />
        </span>
      </div>

      <div className="hidden min-w-0 shrink-0 items-center gap-1.5 lg:flex">
        {project.category && <LabelChip label={project.category} kind="category" />}
        <TagList tags={project.tags} max={2} className="flex-nowrap" />
      </div>

      <DueDate project={project} className="hidden w-36 shrink-0 justify-end sm:inline-flex" />
      <StatusBadge project={project} className="hidden shrink-0 md:inline-flex" />
      <ProgressRing
        value={project.progress}
        size="sm"
        label={progressLabel(project)}
        className={type.text}
      />
    </Link>
  );
}
