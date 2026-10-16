import { Link, useNavigate } from 'react-router';
import {
  Bell,
  FolderKanban,
  Lightbulb,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Avatar, Button, Dropdown, LogoMark, ThemeToggle } from '@/components/ui';
import { demoUser } from './navigation';

function SearchButton() {
  const handleClick = () =>
    toast.info('Поиск появится на этапе 9', { description: 'А Ctrl+K — в версии 1.3' });

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="focus-ring hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted shadow-soft transition-colors hover:bg-surface-2 sm:flex"
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="flex-1 text-left">Поиск…</span>
        <kbd className="rounded border border-border bg-surface-2 px-1.5 font-sans text-[11px]">
          Ctrl K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        aria-label="Поиск"
        className="text-muted hover:text-fg sm:hidden"
      >
        <Search />
      </Button>
    </>
  );
}

export function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const soon = (what, stage) => () => toast.info(`${what} — этап ${stage}`);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg/80 px-3 backdrop-blur-md sm:gap-3 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Открыть меню"
        className="-ml-1 md:hidden"
      >
        <Menu />
      </Button>
      <Link to="/app" className="focus-ring rounded-md md:hidden" aria-label="Frame — на дашборд">
        <LogoMark className="size-7 text-fg" title="" />
      </Link>

      <div className="flex flex-1 justify-end sm:justify-start">
        <SearchButton />
      </div>

      <Dropdown
        trigger={
          <Button size="sm" leftIcon={<Plus />} aria-label="Создать">
            <span className="hidden sm:inline">Создать</span>
          </Button>
        }
        items={[
          { label: 'Проект', icon: FolderKanban, onSelect: soon('Создание проектов', 6) },
          { label: 'Задачу', icon: ListChecks, onSelect: soon('Задачи', 7) },
          { label: 'Идею', icon: Lightbulb, shortcut: 'N', onSelect: soon('Идеи', 8) },
        ]}
      />

      <ThemeToggle variant="icon" className="hidden sm:inline-flex" />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/app/notifications')}
        aria-label="Уведомления"
        className="text-muted hover:text-fg"
      >
        <Bell />
      </Button>

      <Dropdown
        trigger={
          <button
            type="button"
            className="focus-ring rounded-full"
            aria-label={`Меню пользователя ${demoUser.name}`}
          >
            <Avatar name={demoUser.name} size="sm" />
          </button>
        }
        items={[
          { type: 'label', label: demoUser.email },
          { label: 'Профиль', icon: User, onSelect: () => navigate('/app/settings/profile') },
          {
            label: 'Настройки',
            icon: Settings,
            onSelect: () => navigate('/app/settings/appearance'),
          },
          { type: 'separator' },
          { label: 'Выйти', icon: LogOut, danger: true, onSelect: soon('Выход', 4) },
        ]}
      />
    </header>
  );
}
