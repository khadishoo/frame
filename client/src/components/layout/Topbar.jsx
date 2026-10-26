import { Link, useNavigate } from 'react-router';
import {
  Bell,
  FolderKanban,
  Lightbulb,
  ListChecks,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Plus,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import { useThemeStore } from '@/lib/theme';
import { toast } from '@/lib/toast';
import { Avatar, Button, Dropdown, LogoMark, ThemeToggle } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useQuickIdea } from '@/features/notes/quickIdeaStore';
import { useProjectModal } from '@/features/projects/projectModalStore';
import { GlobalSearch } from '@/features/search/components/GlobalSearch';

const themeItems = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Как в системе', icon: Monitor },
];

export function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const openCreateProject = useProjectModal((s) => s.openCreate);
  const openQuickIdea = useQuickIdea((s) => s.openQuickIdea);
  const themePreference = useThemeStore((s) => s.preference);
  const setTheme = useThemeStore((s) => s.setPreference);

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
        <GlobalSearch />
      </div>

      <Dropdown
        trigger={
          <Button size="sm" leftIcon={<Plus />} aria-label="Создать">
            <span className="hidden sm:inline">Создать</span>
          </Button>
        }
        items={[
          { label: 'Проект', icon: FolderKanban, onSelect: openCreateProject },
          { label: 'Идею', icon: Lightbulb, shortcut: 'N', onSelect: () => openQuickIdea() },
          {
            label: 'Задачу',
            icon: ListChecks,
            onSelect: () =>
              toast.info('Задачи добавляются на доске проекта', {
                description: 'Откройте проект → вкладка «Доска» → «Добавить задачу».',
              }),
          },
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
            aria-label={`Меню пользователя ${user.name}`}
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          </button>
        }
        items={[
          { type: 'label', label: user.email },
          { label: 'Профиль', icon: User, onSelect: () => navigate('/app/settings/profile') },
          { label: 'Настройки', icon: Settings, onSelect: () => navigate('/app/settings/account') },
          { type: 'separator' },
          { type: 'label', label: 'Тема' },
          ...themeItems.map(({ value, label, icon }) => ({
            label,
            icon,
            checked: themePreference === value,
            onSelect: () => setTheme(value),
          })),
          { type: 'separator' },
          { label: 'Выйти', icon: LogOut, danger: true, onSelect: logout },
        ]}
      />
    </header>
  );
}
