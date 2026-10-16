import { Link, Outlet } from 'react-router';
import { Logo, ThemeToggle } from '@/components/ui';

/** Вход, регистрация, восстановление пароля, приглашение: карточка по центру. */
export function AuthLayout() {
  return (
    <div className="bg-grain flex min-h-dvh flex-col items-center px-4 py-8 sm:py-12">
      <Link to="/" className="focus-ring rounded-md" aria-label="Frame — на главную">
        <Logo />
      </Link>

      <main className="flex w-full flex-1 items-center justify-center py-8">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-soft sm:p-8">
          <Outlet />
        </div>
      </main>

      <ThemeToggle />
    </div>
  );
}
