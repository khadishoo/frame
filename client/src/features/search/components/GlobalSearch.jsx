import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { isSearchHotkey } from '../results';
import { SearchBox } from './SearchBox';

const DESKTOP = '(min-width: 640px)';

/** Телефон: поиск на весь экран (в топбаре для поля нет места). */
function MobileSearch({ onClose }) {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, true);
  useLockBodyScroll(true);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Поиск"
      className="fixed inset-0 z-50 flex flex-col bg-bg px-4 pb-[env(safe-area-inset-bottom)] pt-3"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть поиск">
            <ArrowLeft />
          </Button>
          <span className="text-base font-semibold text-fg">Поиск</span>
        </div>
        {/* Автофокус: окно открыли, чтобы печатать */}
        <SearchBox variant="fullscreen" onNavigate={onClose} onEscape={onClose} autoFocus />
      </div>
    </div>,
    document.body,
  );
}

/** Поиск в топбаре: поле (от 640 px) или кнопка → полноэкранный поиск. Ctrl/Cmd+K — фокус. */
export function GlobalSearch() {
  const inputRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isSearchHotkey(event)) return;
      // Открыто другое модальное окно — у него своя клавиатура
      if (document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault(); // иначе браузер ставит фокус в свою адресную строку
      if (window.matchMedia(DESKTOP).matches) {
        inputRef.current?.focus();
        inputRef.current?.select();
      } else {
        setMobileOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <SearchBox inputRef={inputRef} className="hidden w-full max-w-sm sm:block" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        aria-label="Поиск"
        className="text-muted hover:text-fg sm:hidden"
      >
        <Search />
      </Button>
      {mobileOpen && <MobileSearch onClose={() => setMobileOpen(false)} />}
    </>
  );
}
