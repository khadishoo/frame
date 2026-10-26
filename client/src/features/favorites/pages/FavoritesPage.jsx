import { Link } from 'react-router';
import { Star } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { EmptyState, ErrorState, Skeleton, buttonVariants } from '@/components/ui';
import { NoteCard } from '@/features/notes/components/NoteCard';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useFavorites } from '../hooks/useFavorites';

function Section({ title, count, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
        {title}
        <span className="rounded-full bg-surface-2 px-1.5 text-xs font-medium tabular-nums text-muted">
          {count}
        </span>
      </h2>
      {children}
    </section>
  );
}

/** «Избранное»: проекты и идеи со звёздочкой — последние отмеченные первыми. */
export default function FavoritesPage() {
  const { data, isPending, error, refetch, isRefetching } = useFavorites();
  const projects = data?.projects ?? [];
  const notes = data?.notes ?? [];

  let content;
  if (isPending) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <ErrorState
        title="Не удалось загрузить избранное"
        error={error}
        onRetry={refetch}
        retrying={isRefetching}
      />
    );
  } else if (projects.length === 0 && notes.length === 0) {
    content = (
      <EmptyState
        icon={Star}
        title="Здесь пока пусто"
        description="Отмечайте звёздочкой проекты и идеи, к которым часто возвращаетесь, — они соберутся здесь и в боковом меню."
        action={
          <Link to="/app/projects" className={buttonVariants({ variant: 'secondary' })}>
            К проектам
          </Link>
        }
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-8">
        {projects.length > 0 && (
          <Section title="Проекты" count={projects.length}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </Section>
        )}
        {notes.length > 0 && (
          <Section title="Идеи и заметки" count={notes.length}>
            <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </Section>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Избранное" description="Проекты и идеи, которые вы отметили звёздочкой." />
      {content}
    </>
  );
}
