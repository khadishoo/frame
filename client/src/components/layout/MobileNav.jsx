import { useRef } from 'react';
import { NavLink } from 'react-router';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { Button, ThemeToggle } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { mobileTabs } from './navigation';

function DrawerPanel({ onClose }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, true);
  useLockBodyScroll(true);

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <m.div
        className="absolute inset-0 bg-overlay/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        tabIndex={-1}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
        className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-border bg-bg shadow-pop outline-none"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Закрыть меню"
          className="absolute right-3 top-4 z-10 text-muted"
        >
          <X />
        </Button>
        <Sidebar compact={false} onNavigate={onClose} className="min-h-0 flex-1 overflow-y-auto" />
        <div className="flex items-center justify-between border-t border-border px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <span className="text-sm text-muted">Тема</span>
          <ThemeToggle />
        </div>
      </m.div>
    </div>
  );
}

/** Выдвижное меню слева (телефоны). Закрывается по Esc, клику по фону и переходу по ссылке. */
export function MobileDrawer({ open, onClose }) {
  return <AnimatePresence>{open && <DrawerPanel onClose={onClose} />}</AnimatePresence>;
}

/** Нижний таб-бар (только телефоны, < 768 px). */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Быстрая навигация"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'focus-ring flex h-full flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors',
                    isActive ? 'text-fg' : 'text-muted hover:text-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-surface-2',
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {item.shortLabel ?? item.label}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
