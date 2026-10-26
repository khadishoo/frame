import { NavLink, Outlet } from 'react-router';
import { m } from 'framer-motion';
import { KeyRound, Palette, Tags, User } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { cn } from '@/lib/cn';

const sections = [
  { to: 'profile', label: 'Профиль', icon: User },
  { to: 'account', label: 'Аккаунт', icon: KeyRound },
  { to: 'appearance', label: 'Оформление', icon: Palette },
  { to: 'labels', label: 'Категории и теги', icon: Tags },
];

/** Каркас /app/settings/*: вкладки-ссылки (на телефоне прокручиваются) и содержимое. */
export function SettingsLayout() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Настройки"
        description="Профиль, безопасность, внешний вид, категории и теги."
      />

      <nav
        aria-label="Разделы настроек"
        className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max gap-1 border-b border-border">
          {sections.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'focus-ring relative flex h-10 items-center gap-2 rounded-t-md px-3 text-sm font-medium transition-colors',
                    isActive ? 'text-fg' : 'text-muted hover:text-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                    {isActive && (
                      <m.span
                        layoutId="settings-tab"
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                        transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-6">
        <Outlet />
      </div>
    </div>
  );
}
