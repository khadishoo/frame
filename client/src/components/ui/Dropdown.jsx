import { cloneElement, useCallback, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

const aligns = { start: 'left-0 origin-top-left', end: 'right-0 origin-top-right' };

/**
 * Выпадающее меню.
 * trigger — элемент-кнопка (получит aria-атрибуты; клики и клавиши ловит обёртка).
 * items — [{ label, icon, onSelect, shortcut, danger, disabled }
 *         | { type: 'separator' } | { type: 'label', label }]
 * Клавиатура: ↑/↓, Home/End, Enter, Esc (возвращает фокус на кнопку), Tab закрывает.
 */
export function Dropdown({ trigger, items, align = 'end', className, menuClassName }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const close = useCallback(({ focusTrigger = false } = {}) => {
    setOpen(false);
    // Кнопка-триггер — первый дочерний элемент корня
    if (focusTrigger) rootRef.current?.firstElementChild?.focus();
  }, []);

  const refs = useMemo(() => [rootRef], []);
  useClickOutside(refs, () => close(), open);

  const menuItems = () => [
    ...(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') ?? []),
  ];

  const focusItem = (index) => {
    const list = menuItems();
    if (list.length === 0) return;
    list[(index + list.length) % list.length].focus();
  };

  const openMenu = (focusIndex = 0) => {
    setOpen(true);
    // Ждём отрисовку меню, затем ставим фокус на пункт
    requestAnimationFrame(() => focusItem(focusIndex));
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openMenu(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(-1);
    }
  };

  const handleMenuKeyDown = (event) => {
    const list = menuItems();
    const index = list.indexOf(document.activeElement);
    const actions = {
      ArrowDown: () => focusItem(index + 1),
      ArrowUp: () => focusItem(index - 1),
      Home: () => focusItem(0),
      End: () => focusItem(-1),
      Escape: () => close({ focusTrigger: true }),
      Tab: () => close(),
    };
    const action = actions[event.key];
    if (!action) return;
    if (event.key !== 'Tab') event.preventDefault();
    if (event.key === 'Escape') event.stopPropagation();
    action();
  };

  // События кнопки ловим на обёртке (всплытие), в cloneElement передаём только aria-атрибуты
  const triggerElement = cloneElement(trigger, {
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
  });

  const isInMenu = (event) => menuRef.current?.contains(event.target);

  const handleRootClick = (event) => {
    if (isInMenu(event)) return;
    if (open) close();
    else openMenu(0);
  };

  const handleRootKeyDown = (event) => {
    if (!isInMenu(event)) handleTriggerKeyDown(event);
  };

  return (
    <div
      ref={rootRef}
      onClick={handleRootClick}
      onKeyDown={handleRootKeyDown}
      className={cn('relative inline-flex', className)}
    >
      {triggerElement}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            onKeyDown={handleMenuKeyDown}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute top-full z-40 mt-2 min-w-52 rounded-lg border border-border bg-surface p-1 shadow-pop',
              aligns[align],
              menuClassName,
            )}
          >
            {items.map((item, index) => {
              if (item.type === 'separator') {
                return <div key={index} role="separator" className="my-1 h-px bg-border" />;
              }
              if (item.type === 'label') {
                return (
                  <div key={index} className="px-2.5 pb-1 pt-2 text-xs font-medium text-muted">
                    {item.label}
                  </div>
                );
              }
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect?.();
                    close({ focusTrigger: true });
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors',
                    'hover:bg-surface-2 focus-visible:bg-surface-2 disabled:pointer-events-none disabled:opacity-50',
                    item.danger ? 'text-danger' : 'text-fg',
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn('size-4 shrink-0', !item.danger && 'text-muted')}
                      aria-hidden="true"
                    />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="font-sans text-xs text-muted">{item.shortcut}</kbd>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
