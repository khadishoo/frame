import { useCallback } from 'react';
import { FolderKanban, LayoutGrid, List, Plus, SearchX, Archive } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, EmptyState, ErrorState, Select, Skeleton, Spinner, Tabs } from '@/components/ui';
import { useCategories, useTags } from '@/features/labels/hooks/useLabels';
import { cn } from '@/lib/cn';
import { plural } from '@/lib/dates';
import { statusOptions } from '@/lib/projectStatuses';
import { PROJECT_TYPES, PROJECT_TYPE_KEYS } from '@/lib/projectTypes';
import { ProjectCard, ProjectRow } from '../components/ProjectCard';
import { ProjectSearch } from '../components/ProjectSearch';
import { SORTS, useProjectFilters } from '../hooks/useProjectFilters';
import { useProjects } from '../hooks/useProjects';
import { useProjectModal } from '../projectModalStore';

function TypeChips({ value, onChange }) {
  const chip = (active) =>
    cn(
      'focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
      active
        ? 'border-transparent bg-accent text-accent-fg'
        : 'border-border bg-surface text-muted hover:border-muted/40 hover:text-fg',
    );

  return (
    <div
      role="group"
      aria-label="Творческий тип"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <button
        type="button"
        aria-pressed={!value}
        onClick={() => onChange(undefined)}
        className={chip(!value)}
      >
        Все типы
      </button>
      {PROJECT_TYPE_KEYS.map((key) => {
        const { label, icon: Icon, text } = PROJECT_TYPES[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? undefined : key)}
            className={chip(active)}
          >
            <Icon className={cn('size-3.5', !active && text)} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ViewToggle({ value, onChange }) {
  const options = [
    { value: 'grid', label: 'Сетка', Icon: LayoutGrid },
    { value: 'list', label: 'Список', Icon: List },
  ];
  return (
    <div role="radiogroup" aria-label="Вид" className="inline-flex rounded-lg bg-surface-2 p-1">
      {options.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={label}
          title={label}
          onClick={() => onChange(v)}
          className={cn(
            'focus-ring flex size-8 items-center justify-center rounded-md transition-colors',
            value === v ? 'bg-surface text-fg shadow-soft' : 'text-muted hover:text-fg',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function LoadingState({ view }) {
  if (view === 'list') {
    return (
      <div
        className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-2"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-9" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="size-6 rounded-full" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-surface">
          <Skeleton className="h-24 rounded-none" />
          <div className="flex flex-col gap-2.5 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-1">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  const filters = useProjectFilters();
  const { view, update, reset, hasFilters, isArchive } = filters;
  const openCreate = useProjectModal((s) => s.openCreate);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPlaceholderData,
  } = useProjects(filters.query);

  const projects = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // Начало и очистка поиска — новая запись в истории («Назад» их отменяет),
  // правка уже идущего поиска — замена (иначе каждая пауза в наборе стала бы шагом «Назад»)
  const currentQ = filters.q;
  const onSearch = useCallback(
    (q) => update({ q }, { replace: Boolean(currentQ) && Boolean(q) }),
    [update, currentQ],
  );

  let content;
  if (isPending) {
    content = <LoadingState view={view} />;
  } else if (isError) {
    content = (
      <ErrorState
        title="Не удалось загрузить проекты"
        error={error}
        onRetry={refetch}
        retrying={isRefetching}
      />
    );
  } else if (total === 0 && hasFilters) {
    content = (
      <EmptyState
        icon={SearchX}
        title="Ничего не найдено"
        description="Под эти фильтры не подходит ни один проект."
        action={
          <Button variant="secondary" onClick={reset}>
            Сбросить фильтры
          </Button>
        }
      />
    );
  } else if (total === 0 && isArchive) {
    content = (
      <EmptyState
        icon={Archive}
        title="Архив пуст"
        description="Сюда попадают проекты, которые вы убрали в архив, — их всегда можно восстановить."
      />
    );
  } else if (total === 0) {
    content = (
      <EmptyState
        icon={FolderKanban}
        title="Проектов пока нет"
        description="Соберите идеи, референсы и задачи в одном месте — начните с первого проекта."
        action={
          <Button leftIcon={<Plus />} onClick={openCreate}>
            Создать первый проект
          </Button>
        }
      />
    );
  } else {
    content = (
      <div
        className={cn('flex flex-col gap-6 transition-opacity', isPlaceholderData && 'opacity-60')}
      >
        {view === 'grid' ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id} className="flex">
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-0.5 rounded-xl border border-border bg-surface p-1.5 shadow-soft">
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectRow project={project} />
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
            >
              Показать ещё
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Проекты"
        description="Все творческие проекты пространства."
        actions={
          <Button leftIcon={<Plus />} onClick={openCreate}>
            Новый проект
          </Button>
        }
      />

      <Tabs
        variant="pills"
        label="Активные или архив"
        value={isArchive ? 'archived' : 'active'}
        onValueChange={(v) => update({ status: v === 'archived' ? 'archived' : undefined })}
        items={[
          { value: 'active', label: 'Проекты' },
          { value: 'archived', label: 'Архив', icon: Archive },
        ]}
        className="mb-4"
      />

      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ProjectSearch value={filters.q} onSearch={onSearch} className="sm:max-w-xs sm:flex-1" />
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <Select
              aria-label="Сортировка"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value })}
              options={Object.entries(SORTS).map(([value, label]) => ({ value, label }))}
              className="flex-1 sm:w-56 sm:flex-none"
            />
            <ViewToggle value={view} onChange={(v) => update({ view: v })} />
          </div>
        </div>

        <TypeChips value={filters.type} onChange={(type) => update({ type })} />

        <div className="grid grid-cols-1 gap-2 xs:grid-cols-3 sm:flex sm:flex-wrap sm:items-center">
          <Select
            aria-label="Статус"
            value={isArchive ? '' : (filters.status ?? '')}
            disabled={isArchive}
            onChange={(e) => update({ status: e.target.value || undefined })}
            options={[{ value: '', label: 'Все статусы' }, ...statusOptions]}
            className="sm:w-44"
          />
          <Select
            aria-label="Категория"
            value={filters.category ?? ''}
            onChange={(e) => update({ category: e.target.value || undefined })}
            options={[
              { value: '', label: 'Все категории' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
              { value: 'none', label: 'Без категории' },
            ]}
            className="sm:w-44"
          />
          <Select
            aria-label="Тег"
            value={filters.tag ?? ''}
            onChange={(e) => update({ tag: e.target.value || undefined })}
            options={[
              { value: '', label: tags.length ? 'Все теги' : 'Тегов пока нет' },
              ...tags.map((t) => ({ value: t.id, label: `#${t.name}` })),
            ]}
            className="sm:w-44"
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset} className="justify-self-start">
              Сбросить фильтры
            </Button>
          )}
        </div>
      </div>

      {!isPending && !isError && total > 0 && (
        <p className="mb-3 flex items-center gap-2 text-sm text-muted" aria-live="polite">
          {isArchive ? 'В архиве' : 'Найдено'} {total}{' '}
          {plural(total, ['проект', 'проекта', 'проектов'])}
          {isPlaceholderData && <Spinner size="sm" label="Обновляю список" />}
        </p>
      )}

      {content}
    </>
  );
}
