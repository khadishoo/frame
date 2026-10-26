import { Link } from 'react-router';
import { Pin } from 'lucide-react';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { cn } from '@/lib/cn';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { NOTE_CARD_COLORS, noteTitle, plainText } from '../noteColors';

const formatUpdated = (iso) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');

/**
 * Карточка идеи для masonry-сетки. Вся карточка — ссылка в редактор; звёздочка — рядом
 * со ссылкой (кнопка внутри ссылки — некорректный HTML).
 */
export function NoteCard({ note, className }) {
  const text = plainText(note.content);
  const type = note.project ? PROJECT_TYPES[note.project.type] : null;

  return (
    <article className={cn('group relative break-inside-avoid', className)}>
      <Link
        to={`/app/ideas/${note.id}`}
        className={cn(
          'focus-ring flex flex-col gap-2 rounded-xl border p-4 pr-11 shadow-soft',
          'transition-[box-shadow,transform] duration-200 hover:shadow-pop motion-safe:hover:-translate-y-0.5',
          note.color ? NOTE_CARD_COLORS[note.color] : 'border-border bg-surface',
        )}
      >
        <h3
          className={cn(
            'line-clamp-2 break-words text-sm font-semibold text-fg',
            !note.title.trim() && (note.color ? 'text-fg/70' : 'text-muted'),
          )}
        >
          {note.isPinned && (
            <Pin
              className="mr-1 inline size-3.5 -rotate-45 text-muted"
              role="img"
              aria-label="Закреплено"
            />
          )}
          {noteTitle(note)}
        </h3>
        {text && (
          <p className="line-clamp-[8] whitespace-pre-line break-words text-sm text-fg/80">
            {text}
          </p>
        )}
        {/* На цветной карточке серый text-muted чуть не дотягивает до контраста 4.5:1 */}
        <div
          className={cn(
            'mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs',
            note.color ? 'text-fg/70' : 'text-muted',
          )}
        >
          {note.project && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className={cn('size-2 shrink-0 rounded-full', type.dot)} aria-hidden="true" />
              <span className="max-w-40 truncate">{note.project.title}</span>
            </span>
          )}
          <time dateTime={note.updatedAt}>{formatUpdated(note.updatedAt)}</time>
        </div>
      </Link>
      <FavoriteButton type="note" item={note} size="sm" className="absolute right-2 top-2" />
    </article>
  );
}
