import { NavLink, Outlet } from 'react-router';
import { KeyRound, Palette, User } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { cn } from '@/lib/cn';

const sections = [
  { to: 'profile', label: 'Профиль', icon: User },
  { to: 'account', label: 'Аккаунт', icon: KeyRound },
  { to: 'appearance', label: 'Оформление', icon: Palette },
];

/** Общий каркас /app/settings/*: подменю слева (на телефоне — сверху) и контент. */
export function SettingsLayout() {
  return (
    <>
      <PageHeader title="Настройки" description="Профиль, безопасность и внешний вид." />
      <div className="flex flex-col gap-6 md:flex-row md:gap-10">
        <nav
          aria-label="Разделы настроек"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:w-48 md:shrink-0 md:flex-col md:px-0"
        >
          {sections.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'focus-ring flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-2 text-fg'
                    : 'text-muted hover:bg-surface-2/60 hover:text-fg',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </>
  );
}
