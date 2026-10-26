import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToggleFavorite } from '../hooks/useFavorites';

/**
 * Звёздочка «в избранное» для проекта или заметки (type — 'project' | 'note').
 * Состояние берётся из item.isFavorite — его оптимистично обновляет useToggleFavorite.
 * Внутри карточки-ссылки кнопку ставить нельзя — только рядом (см. ProjectCard).
 */
export function FavoriteButton({ type, item, size = 'md', className }) {
  const toggle = useToggleFavorite();
  const active = Boolean(item.isFavorite);
  const label = active ? 'Убрать из избранного' : 'Добавить в избранное';

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${label}: ${item.title || 'без названия'}`}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle.mutate({ type, item, value: !active });
      }}
      className={cn(
        'focus-ring inline-flex shrink-0 items-center justify-center rounded-lg transition-colors',
        size === 'sm' ? 'size-7 [&_svg]:size-4' : 'size-9 [&_svg]:size-[18px]',
        active ? 'text-warning' : 'text-muted hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      <Star
        className={cn(
          'transition-transform duration-150',
          active && 'fill-current motion-safe:scale-110',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
