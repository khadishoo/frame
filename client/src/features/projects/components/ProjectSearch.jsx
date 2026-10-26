import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fieldClasses } from '@/components/ui/fieldClasses';

/**
 * Поиск по названию: ввод сразу, запрос в адрес — через 300 мс после последней буквы.
 * value — значение из адреса, onSearch(value) — записать в адрес.
 * label / placeholder — для других списков (например, «Идеи» ищут и по тексту).
 */
export function ProjectSearch({
  value,
  onSearch,
  label = 'Поиск по названию',
  placeholder = 'Поиск по названию…',
  className,
}) {
  const [input, setInput] = useState(value);
  const [synced, setSynced] = useState(value);

  // Адрес изменился снаружи («Назад», «Сбросить фильтры») — подтягиваем в поле.
  // Обновление состояния во время рендера — рекомендованный React способ вместо useEffect
  if (value !== synced) {
    setSynced(value);
    setInput(value);
  }

  useEffect(() => {
    if (input.trim() === value) return undefined;
    const timer = setTimeout(() => onSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input, value, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        maxLength={100}
        className={cn(
          fieldClasses(false),
          'h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {input && (
        <button
          type="button"
          onClick={() => {
            setInput('');
            onSearch('');
          }}
          aria-label="Очистить поиск"
          className="focus-ring absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
