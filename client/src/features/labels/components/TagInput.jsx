import { useId, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { labelColor } from '@/lib/labelColors';
import { Field } from '@/components/ui/Field';
import { fieldClasses } from '@/components/ui/fieldClasses';

const MAX_TAGS = 20;
const normalize = (s) => s.trim().toLowerCase();

/**
 * Ввод тегов: выбранные — чипами, автодополнение из тегов пространства,
 * Enter — выбрать подсказку или создать новый тег, Backspace в пустом поле — убрать последний.
 * Доступность: шаблон WAI-ARIA «combobox» (поле + listbox, aria-activedescendant).
 *
 * value — массив id, tags — все теги пространства [{ id, name, color }],
 * onChange(ids), onCreate(name) → Promise<tag>.
 */
export function TagInput({ label = 'Теги', value, onChange, tags, onCreate, hint, error }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);
  const listId = useId();

  const byId = new Map(tags.map((t) => [t.id, t]));
  const selected = value.map((id) => byId.get(id)).filter(Boolean);
  const q = normalize(query);
  const suggestions = tags
    .filter((t) => !value.includes(t.id) && (!q || normalize(t.name).includes(q)))
    .slice(0, 8);
  const exact = tags.find((t) => normalize(t.name) === q);
  const canCreate = Boolean(q) && !exact && Boolean(onCreate);
  // Пункты списка: подсказки + «Создать …» в конце
  const options = [
    ...suggestions.map((tag) => ({ type: 'tag', tag })),
    ...(canCreate ? [{ type: 'create', name: query.trim() }] : []),
  ];
  const full = value.length >= MAX_TAGS;
  const showList = open && !full && options.length > 0;
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));

  const add = (id) => {
    if (!value.includes(id)) onChange([...value, id]);
    setQuery('');
    setActive(0);
  };

  const remove = (id) => onChange(value.filter((v) => v !== id));

  const choose = async (option) => {
    if (!option) return;
    if (option.type === 'tag') {
      add(option.tag.id);
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      const tag = await onCreate(option.name);
      add(tag.id);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setOpen(true);
        setActive((i) => (options.length ? (i + 1) % options.length : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setOpen(true);
        setActive((i) => (options.length ? (i - 1 + options.length) % options.length : 0));
        break;
      case 'Enter':
        // Enter внутри формы не должен отправлять её, пока идёт ввод тега
        if (query.trim() || showList) {
          event.preventDefault();
          if (exact && !value.includes(exact.id)) add(exact.id);
          else if (showList) choose(options[activeIndex]);
        }
        break;
      case 'Backspace':
        if (!query && selected.length > 0) remove(selected[selected.length - 1].id);
        break;
      case 'Escape':
        if (showList) {
          event.preventDefault();
          event.stopPropagation(); // не закрывать модальное окно
          setOpen(false);
        }
        break;
      default:
    }
  };

  return (
    <Field label={label} hint={full ? `Не больше ${MAX_TAGS} тегов` : hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <div
            className={cn(
              fieldClasses(invalid),
              'flex min-h-10 cursor-text flex-wrap items-center gap-1.5 px-2 py-1.5',
              'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25',
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {selected.map((tag) => (
              <span
                key={tag.id}
                className={cn(
                  'inline-flex h-6 items-center gap-1 rounded-full pl-2 pr-1 text-xs font-medium',
                  labelColor(tag.color).chip,
                )}
              >
                #{tag.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(tag.id);
                  }}
                  aria-label={`Убрать тег ${tag.name}`}
                  className="focus-ring flex size-4 items-center justify-center rounded-full hover:bg-fg/10"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              id={id}
              role="combobox"
              aria-expanded={showList}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={showList ? `${listId}-${activeIndex}` : undefined}
              aria-describedby={describedBy}
              autoComplete="off"
              value={query}
              disabled={full}
              // readOnly, а не disabled: отключённое поле теряет фокус, и Backspace перестал бы работать
              readOnly={creating}
              aria-busy={creating || undefined}
              maxLength={40}
              placeholder={selected.length ? '' : 'Начните вводить — например, «черновик»'}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                setActive(0);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={handleKeyDown}
              className="min-w-24 flex-1 bg-transparent py-0.5 text-sm text-fg outline-none placeholder:text-muted/70 disabled:cursor-not-allowed"
            />
          </div>

          {showList && (
            <ul
              id={listId}
              role="listbox"
              aria-label="Подсказки тегов"
              className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-pop"
            >
              {options.map((option, index) => (
                <li
                  key={option.type === 'tag' ? option.tag.id : 'create'}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  // mousedown, а не click: иначе blur поля закроет список раньше
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm',
                    index === activeIndex ? 'bg-surface-2 text-fg' : 'text-fg',
                  )}
                >
                  {option.type === 'tag' ? (
                    <>
                      <span
                        className={cn('size-2 rounded-full', labelColor(option.tag.color).dot)}
                        aria-hidden="true"
                      />
                      #{option.tag.name}
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 text-muted" aria-hidden="true" />
                      Создать тег «{option.name}»
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}
