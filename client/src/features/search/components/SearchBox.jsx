import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Lightbulb, ListChecks, LoaderCircle, Search, SearchX, X } from 'lucide-react';
import { fieldClasses } from '@/components/ui/fieldClasses';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { NOTE_CARD_COLORS } from '@/features/notes/noteColors';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { TASK_STATUSES } from '@/lib/taskMeta';
import { TaskDue } from '@/features/tasks/components/TaskBits';
import { Highlight } from '../highlight';
import { MIN_QUERY, useSearch } from '../hooks/useSearch';
import { SEARCH_GROUPS, flattenResults } from '../results';

function OptionContent({ option, q }) {
  const { group, item } = option;
  if (group === 'projects') {
    const type = PROJECT_TYPES[item.type];
    const Icon = type.icon;
    return (
      <>
        <span
          className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', type.soft)}
        >
          <Icon className={cn('size-4', type.text)} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-fg">
            <Highlight text={item.title} query={q} />
          </span>
          <span className="truncate text-xs text-muted">
            {item.snippet ? <Highlight text={item.snippet} query={q} /> : type.label}
          </span>
        </span>
      </>
    );
  }
  if (group === 'tasks') {
    const type = PROJECT_TYPES[item.project.type];
    return (
      <>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
          <ListChecks className="size-4 text-muted" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate text-sm font-medium text-fg',
              item.status === 'done' && 'text-muted line-through decoration-muted/50',
            )}
          >
            <Highlight text={item.title} query={q} />
          </span>
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted">
            <span className={cn('size-2 shrink-0 rounded-full', type.dot)} aria-hidden="true" />
            <span className="truncate">{item.project.title}</span>
            <span className="shrink-0">· {TASK_STATUSES[item.status].label}</span>
            <TaskDue task={item} className="shrink-0" />
          </span>
        </span>
      </>
    );
  }
  return (
    <>
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg border',
          item.color ? NOTE_CARD_COLORS[item.color] : 'border-transparent bg-surface-2',
        )}
      >
        <Lightbulb className="size-4 text-muted" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate text-sm font-medium', item.title ? 'text-fg' : 'text-muted')}>
          {item.title ? <Highlight text={item.title} query={q} /> : 'Без названия'}
        </span>
        {item.snippet && (
          <span className="truncate text-xs text-muted">
            <Highlight text={item.snippet} query={q} />
          </span>
        )}
      </span>
    </>
  );
}

function Message({ icon: Icon, title, text, spin }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      {Icon && (
        <Icon className={cn('size-6 text-muted', spin && 'animate-spin')} aria-hidden="true" />
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {text && <p className="max-w-64 text-xs text-muted">{text}</p>}
    </div>
  );
}

/**
 * Поиск по проектам, задачам и заметкам (комбобокс WAI-ARIA): фокус остаётся в поле,
 * ↑/↓ выбирают результат (aria-activedescendant), Enter открывает, Esc закрывает.
 * variant: 'inline' — поле в топбаре с выпадающим списком; 'fullscreen' — телефон.
 */
export function SearchBox({
  inputRef,
  variant = 'inline',
  onNavigate,
  onEscape,
  autoFocus = false,
  className,
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(variant === 'fullscreen');
  const [active, setActive] = useState(-1);
  const rootRef = useRef(null);
  const ownRef = useRef(null);
  const fieldRef = inputRef ?? ownRef;
  const navigate = useNavigate();
  const listId = useId();

  const { data, error, isFetching, typing, enabled } = useSearch(input);
  const options = useMemo(() => flattenResults(data), [data]);
  const activeIndex = active < options.length ? active : -1;
  const optionId = (index) => `${listId}-option-${index}`;
  const trimmed = input.trim();
  const fullscreen = variant === 'fullscreen';

  const refs = useMemo(() => [rootRef], []);
  useClickOutside(refs, () => setOpen(false), open && !fullscreen);

  // Выбранный стрелками пункт — всегда в видимой части списка
  useEffect(() => {
    if (activeIndex >= 0) {
      document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    }
  });

  const go = (option) => {
    if (!option) return;
    navigate(option.href);
    setInput('');
    setActive(-1);
    setOpen(fullscreen);
    fieldRef.current?.blur();
    onNavigate?.();
  };

  const handleKeyDown = (event) => {
    const count = options.length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (count === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => {
        const from = i < count ? i : -1;
        return from === -1 && step === -1 ? count - 1 : (from + step + count) % count;
      });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // Ничего не выбрано стрелками — открываем первый результат
      go(options[activeIndex] ?? options[0]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (fullscreen) onEscape?.();
      else if (open && trimmed) setOpen(false);
      else {
        setInput('');
        fieldRef.current?.blur();
      }
    }
  };

  const showPopup = (open || fullscreen) && trimmed.length > 0;
  const total = options.length;
  const searching = enabled && (typing || isFetching) && !data;

  let body = null;
  if (showPopup) {
    if (trimmed.length < MIN_QUERY) {
      body = <Message title="Введите ещё хотя бы символ" text="Ищем от 2 символов." />;
    } else if (error) {
      body = <Message icon={SearchX} title="Поиск не удался" text={getErrorMessage(error)} />;
    } else if (searching || (!data && typing)) {
      body = <Message icon={LoaderCircle} spin title="Ищем…" />;
    } else if (total === 0 && !typing && !isFetching) {
      body = (
        <Message
          icon={SearchX}
          title={`По запросу «${trimmed}» ничего нет`}
          text="Проверьте опечатки или попробуйте часть слова. Ищем в названиях проектов и задач, в тексте идей."
        />
      );
    } else if (total > 0) {
      body = (
        <div
          id={listId}
          role="listbox"
          aria-label="Результаты поиска"
          className={cn('flex flex-col gap-3 p-2', (typing || isFetching) && 'opacity-70')}
        >
          {SEARCH_GROUPS.filter(({ key }) => data[key].length > 0).map((group) => (
            <div key={group.key} role="group" aria-labelledby={`${listId}-${group.key}`}>
              <div
                id={`${listId}-${group.key}`}
                role="presentation"
                className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted"
              >
                {group.label}
              </div>
              {options
                .filter((option) => option.group === group.key)
                .map((option) => {
                  const i = option.index;
                  return (
                    <div
                      key={option.id}
                      id={optionId(i)}
                      role="option"
                      aria-selected={i === activeIndex}
                      // mousedown, а не click: иначе поле теряет фокус раньше, чем сработает переход
                      onMouseDown={(e) => {
                        e.preventDefault();
                        go(option);
                      }}
                      onMouseMove={() => setActive(i)}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5',
                        i === activeIndex ? 'bg-surface-2' : 'hover:bg-surface-2/60',
                      )}
                    >
                      <OptionContent option={option} q={data.q} />
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative', fullscreen && 'flex min-h-0 flex-1 flex-col', className)}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          ref={fieldRef}
          type="text"
          role="combobox"
          aria-label="Поиск по проектам, задачам и заметкам"
          aria-expanded={showPopup && total > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск…"
          maxLength={100}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          className={cn(
            fieldClasses(false),
            'pl-9',
            fullscreen ? 'h-11 pr-10 text-base' : 'h-9 pr-16',
          )}
        />
        {input ? (
          <button
            type="button"
            onClick={() => {
              setInput('');
              fieldRef.current?.focus();
            }}
            aria-label="Очистить поиск"
            className="focus-ring absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-fg"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : (
          !fullscreen && (
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-surface-2 px-1.5 font-sans text-[11px] text-muted">
              Ctrl K
            </kbd>
          )
        )}
      </div>

      {/* Сколько нашлось — для экранного диктора */}
      <span className="sr-only" role="status" aria-live="polite">
        {showPopup && data && !typing ? `Найдено: ${total}` : ''}
      </span>

      {body &&
        (fullscreen ? (
          <div className="-mx-4 mt-3 flex-1 overflow-y-auto px-2">{body}</div>
        ) : (
          <div className="absolute left-0 top-full z-40 mt-2 max-h-[70vh] w-[min(34rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border bg-surface shadow-pop">
            {body}
            {total > 0 && (
              <p className="border-t border-border px-4 py-2 text-xs text-muted">
                ↑↓ — выбрать · Enter — открыть · Esc — закрыть
              </p>
            )}
          </div>
        ))}
    </div>
  );
}
