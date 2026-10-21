import { Link, NavLink } from 'react-router';
import { Check, ChevronsUpDown, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { Avatar, Dropdown, Logo, LogoMark } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
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
            Л
          </span>
          <span className={cn('flex min-w-0 flex-1 flex-col', labelClass(compact))}>
            <span className="truncate text-sm font-medium text-fg">Личное пространство</span>
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
        { label: 'Личное пространство', icon: Check },
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

      <section className={cn('flex flex-col gap-2 px-2.5', labelClass(compact))}>
        <h2 className="font-sans text-xs font-medium uppercase tracking-wider text-muted">
          Избранные проекты
        </h2>
        <p className="flex items-center gap-2 text-xs text-muted/80">
          <Star className="size-3.5" aria-hidden="true" />
          Отмечайте проекты звёздочкой
        </p>
      </section>

      <nav aria-label="Настройки" className="mt-auto flex flex-col gap-0.5">
        {secondaryNav.map((item) => (
          <NavItem key={item.to} item={item} compact={compact} onNavigate={onNavigate} />
        ))}
      </nav>

      <UserCard compact={compact} />
    </aside>
  );
}
