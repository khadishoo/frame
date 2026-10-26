import { useSearchParams } from 'react-router';
import { Lightbulb, Plus, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, EmptyState, Select, Skeleton } from '@/components/ui';
import { ProjectSearch } from '@/features/projects/components/ProjectSearch';
import { useProjectOptions } from '@/features/projects/hooks/useProjects';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { NoteCard } from '../components/NoteCard';
import { useNotes } from '../hooks/useNotes';
import { useQuickIdea } from '../quickIdeaStore';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Masonry: CSS-колонки — карточки разной высоты плотно, без JS-раскладки. */
function NoteGrid({ notes }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}

function IdeasSkeleton() {
  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4" aria-hidden="true">
      {['h-28', 'h-40', 'h-24', 'h-36', 'h-20', 'h-32'].map((h) => (
        <Skeleton key={h} className={`break-inside-avoid ${h}`} />
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** «Идеи»: заметки пространства. Поиск (?q) и проект (?project=<id>|none) — в адресе. */
export default function IdeasPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const rawProject = params.get('project') ?? '';
  const project = rawProject === 'none' || UUID_RE.test(rawProject) ? rawProject : '';

  const { data, isPending, error, isPlaceholderData } = useNotes({ q, projectId: project });
  const { data: projects = [] } = useProjectOptions();
  const { workspace } = useCurrentWorkspace();
  const openQuickIdea = useQuickIdea((s) => s.openQuickIdea);
  const canEdit = workspace?.role !== 'viewer';

  const setParam = (key, value, { replace = false } = {}) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace },
    );

  const filtered = Boolean(q || project);
  const notes = data?.items ?? [];
  const pinned = notes.filter((n) => n.isPinned);
  const rest = notes.filter((n) => !n.isPinned);

  let content;
  if (isPending) content = <IdeasSkeleton />;
  else if (error) {
    content = (
      <EmptyState
        icon={Lightbulb}
        title="Не удалось загрузить идеи"
        description={getErrorMessage(error)}
      />
    );
  } else if (notes.length === 0 && filtered) {
    content = (
      <EmptyState
        icon={SearchX}
        title="Ничего не найдено"
        description="Попробуйте другой запрос или уберите фильтр по проекту."
        action={
          <Button variant="secondary" onClick={() => setParams({})}>
            Сбросить фильтры
          </Button>
        }
      />
    );
  } else if (notes.length === 0) {
    content = (
      <EmptyState
        icon={Lightbulb}
        title="Идей пока нет"
        description="Записывайте всё, что приходит в голову: сюжет, мелодию, референс. Клавиша N — из любого места."
        action={
          canEdit && (
            <Button leftIcon={<Plus />} onClick={() => openQuickIdea()}>
              Первая идея
            </Button>
          )
        }
      />
    );
  } else {
    content = (
      <div
        className="flex flex-col gap-8 transition-opacity"
        style={{ opacity: isPlaceholderData ? 0.6 : 1 }}
      >
        {pinned.length > 0 && (
          <Section title="Закреплённые">
            <NoteGrid notes={pinned} />
          </Section>
        )}
        {rest.length > 0 && (
          <Section title={pinned.length > 0 ? 'Остальные' : 'Все идеи'}>
            <NoteGrid notes={rest} />
          </Section>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Идеи"
        description="Быстрые заметки, наброски и референсы. Любую идею можно превратить в проект."
        actions={
          canEdit && (
            <Button leftIcon={<Plus />} onClick={() => openQuickIdea()}>
              Идея
              <kbd className="ml-1 hidden rounded border border-accent-fg/40 px-1 font-sans text-[11px] opacity-70 sm:inline">
                N
              </kbd>
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <ProjectSearch
          value={q}
          onSearch={(value) => setParam('q', value, { replace: Boolean(q && value) })}
          label="Поиск по идеям"
          placeholder="Поиск в заголовках и тексте…"
          className="sm:max-w-sm sm:flex-1"
        />
        <Select
          aria-label="Проект"
          value={project}
          onChange={(e) => setParam('project', e.target.value)}
          options={[
            { value: '', label: 'Все проекты' },
            { value: 'none', label: 'Без проекта' },
            ...projects.map((p) => ({ value: p.id, label: p.title })),
          ]}
          className="sm:w-56"
        />
      </div>

      {content}
    </>
  );
}
