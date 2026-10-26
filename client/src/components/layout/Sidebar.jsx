import { Link, NavLink } from 'react-router';
import { Check, ChevronsUpDown, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { Avatar, Dropdown, Logo, LogoMark } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { useFavorites } from '@/features/favorites/hooks/useFavorites';
import { PROJECT_TYPES } from '@/lib/projectTypes';
import { useCurrentWorkspace } from '@/features/workspaces/workspaceStore';
import { mainNav, secondaryNav } from './navigation';

/**
 * compact — на планшетах (md…lg) показываются только иконки.
 * В выдвижном меню на телефоне compact={false}: всегда полная версия.
 */
const labelClass = (compact) => (compact ? 'md:max-lg:sr-only' : '');

function NavItem({ item, compact, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={compact ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'focus-ring group flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
          compact && 'md:max-lg:justify-center md:max-lg:px-0',
          isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2/60 hover:text-fg',
        )
      }
    >
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      <span className={labelClass(compact)}>{item.label}</span>
    </NavLink>
  );
}

function WorkspaceSwitcher({ compact }) {
  const { workspace } = useCurrentWorkspace();
  const name = workspace?.name ?? 'Пространство';

  return (
    <Dropdown
      align="start"
      className="w-full"
      menuClassName="w-60"
      trigger={
        <button
          type="button"
          className={cn(
            'focus-ring flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface p-1.5 text-left shadow-soft transition-colors hover:bg-surface-2',
            compact &&
              'md:max-lg:justify-center md:max-lg:border-transparent md:max-lg:bg-transparent md:max-lg:shadow-none',
          )}
          aria-label="Переключить пространство"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent font-display text-xs font-semibold text-accent-fg">
            {name[0]}
          </span>
          <span className={cn('flex min-w-0 flex-1 flex-col', labelClass(compact))}>
            <span className="truncate text-sm font-medium text-fg">{name}</span>
            <span className="text-xs text-muted">Только вы</span>
          </span>
          <ChevronsUpDown
            className={cn('size-4 shrink-0 text-muted', labelClass(compact))}
            aria-hidden="true"
          />
        </button>
      }
      items={[
        { type: 'label', label: 'Пространства' },
        { label: name, icon: Check },
        { type: 'separator' },
        {
          label: 'Создать пространство',
          icon: Plus,
          onSelect: () => toast.info('Совместные пространства появятся в версии 1.2'),
        },
      ]}
    />
  );
}

function UserCard({ compact }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 border-t border-border px-1.5 pt-3',
        compact && 'md:max-lg:justify-center md:max-lg:px-0',
      )}
      title={compact ? user.name : undefined}
    >
      <Avatar name={user.name} src={user.avatarUrl} size="sm" />
      <span className={cn('flex min-w-0 flex-col', labelClass(compact))}>
        <span className="truncate text-sm font-medium text-fg">{user.name}</span>
        <span className="truncate text-xs text-muted">{user.email}</span>
      </span>
    </div>
  );
}

const MAX_FAVORITES = 6;

/**
 * Избранные проекты (без архивных) — быстрый переход. В компактном сайдбаре (только иконки)
 * раздел скрыт целиком: sr-only оставил бы невидимые ссылки в порядке Tab.
 */
function FavoriteProjects({ compact, onNavigate }) {
  const { data } = useFavorites();
  const projects = (data?.projects ?? []).filter((p) => !p.archivedAt);
  const visible = projects.slice(0, MAX_FAVORITES);

  return (
    <section
      aria-labelledby="sidebar-favorites"
      className={cn('flex min-h-0 flex-col gap-1', compact && 'md:max-lg:hidden')}
    >
      <h2
        id="sidebar-favorites"
        className="px-2.5 font-sans text-xs font-medium uppercase tracking-wider text-muted"
      >
        Избранные проекты
      </h2>
      {visible.length === 0 ? (
        <p className="flex items-center gap-2 px-2.5 text-xs text-muted/80">
          <Star className="size-3.5" aria-hidden="true" />
          Отмечайте проекты звёздочкой
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {visible.map((project) => (
            <li key={project.id}>
              <NavLink
                to={`/app/projects/${project.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'focus-ring flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors',
                    isActive
                      ? 'bg-surface-2 text-fg'
                      : 'text-muted hover:bg-surface-2/60 hover:text-fg',
                  )
                }
              >
                <span
                  className={cn('size-2 shrink-0 rounded-full', PROJECT_TYPES[project.type].dot)}
                  aria-hidden="true"
                />
                <span className="truncate">{project.title}</span>
              </NavLink>
            </li>
          ))}
          {projects.length > MAX_FAVORITES && (
            <li>
              <Link
                to="/app/favorites"
                onClick={onNavigate}
                className="focus-ring flex h-8 items-center rounded-lg px-2.5 text-xs text-muted hover:text-fg"
              >
                Ещё {projects.length - MAX_FAVORITES} — всё избранное
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

export function Sidebar({ compact = true, onNavigate, className }) {
  return (
    <aside className={cn('flex h-full flex-col gap-4 bg-bg px-3 py-4', className)}>
      <Link
        to="/app"
        onClick={onNavigate}
        className={cn(
          'focus-ring flex h-8 items-center rounded-md px-1.5',
          compact && 'md:max-lg:justify-center md:max-lg:px-0',
        )}
        aria-label="Frame — на дашборд"
      >
        {compact ? (
          <>
            <LogoMark className="size-7 text-fg max-md:hidden lg:hidden" title="" />
            <Logo className="md:max-lg:hidden" markClassName="size-7" />
          </>
        ) : (
          <Logo markClassName="size-7" />
        )}
      </Link>

      <WorkspaceSwitcher compact={compact} />

      <nav aria-label="Основное меню" className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavItem key={item.to} item={item} compact={compact} onNavigate={onNavigate} />
        ))}
      </nav>

      <FavoriteProjects compact={compact} onNavigate={onNavigate} />

      <nav aria-label="Настройки" className="mt-auto flex flex-col gap-0.5">
        {secondaryNav.map((item) => (
          <NavItem key={item.to} item={item} compact={compact} onNavigate={onNavigate} />
        ))}
      </nav>

      <UserCard compact={compact} />
    </aside>
  );
}
