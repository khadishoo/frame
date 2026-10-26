import { useId, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Вкладки по паттерну WAI-ARIA: ←/→, Home/End переключают вкладку.
 * items — [{ value, label, icon?, count?, content }]
 * Можно управлять снаружи (value + onValueChange) или оставить состояние внутри (defaultValue).
 * variant: 'underline' | 'pills'
 */
export function Tabs({
  items,
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = 'underline',
  className,
  label,
}) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? items[0]?.value);
  const value = controlledValue ?? innerValue;
  const baseId = useId();
  const tabRefs = useRef({});

  const select = (next) => {
    if (controlledValue === undefined) setInnerValue(next);
    onValueChange?.(next);
  };

  const handleKeyDown = (event) => {
    const index = items.findIndex((item) => item.value === value);
    const moves = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = items[(moves[event.key] + items.length) % items.length];
    select(next.value);
    tabRefs.current[next.value]?.focus();
  };

  const active = items.find((item) => item.value === value);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className={cn(
          // Горизонтальная прокрутка на узких экранах без видимой полосы
          'flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          variant === 'underline'
            ? 'gap-1 border-b border-border'
            : 'w-fit max-w-full gap-1 rounded-lg bg-surface-2 p-1',
        )}
      >
        {items.map((item) => {
          const selected = item.value === value;
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              ref={(el) => {
                tabRefs.current[item.value] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              // Панель рисуется только у выбранной вкладки (и только если есть content) —
              // ссылка на несуществующий id невалидна
              aria-controls={
                selected && item.content !== undefined ? `${baseId}-panel-${item.value}` : undefined
              }
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.value)}
              className={cn(
                'focus-ring relative flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors',
                variant === 'underline' ? 'h-10 rounded-t-md px-3' : 'h-8 rounded-md px-3',
                selected ? 'text-fg' : 'text-muted hover:text-fg',
              )}
            >
              {selected && (
                <m.span
                  layoutId={`${baseId}-indicator`}
                  className={cn(
                    'absolute',
                    variant === 'underline'
                      ? 'inset-x-2 -bottom-px h-0.5 rounded-full bg-accent'
                      : 'inset-0 rounded-md bg-surface shadow-soft',
                  )}
                  transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {Icon && <Icon className="size-4" aria-hidden="true" />}
                {item.label}
                {item.count !== undefined && (
                  <span className="rounded-full bg-surface-2 px-1.5 text-xs text-muted">
                    {item.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.value}`}
          aria-labelledby={`${baseId}-tab-${active.value}`}
          tabIndex={0}
          className="outline-none"
        >
          {active.content}
        </div>
      )}
    </div>
  );
}
