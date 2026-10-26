import { Plus, StickyNote } from 'lucide-react';
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useNotes } from '../hooks/useNotes';
import { useQuickIdea } from '../quickIdeaStore';
import { NoteCard } from './NoteCard';

/** Вкладка «Заметки» на странице проекта: идеи, привязанные к проекту. */
export function ProjectNotes({ projectId, readOnly }) {
  const { data, isPending, error, refetch, isRefetching } = useNotes({ projectId });
  const openQuickIdea = useQuickIdea((s) => s.openQuickIdea);
  const notes = data?.items ?? [];

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }
  if (error) {
    return (
      <ErrorState
        title="Не удалось загрузить заметки"
        error={error}
        onRetry={refetch}
        retrying={isRefetching}
      />
    );
  }

  const addButton = !readOnly && (
    <Button variant="secondary" leftIcon={<Plus />} onClick={() => openQuickIdea({ projectId })}>
      Новая заметка
    </Button>
  );

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="Заметок пока нет"
        description="Референсы, черновики, мысли по проекту. Любую идею со страницы «Идеи» тоже можно привязать к проекту."
        action={addButton}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {addButton && <div className="flex justify-end">{addButton}</div>}
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
