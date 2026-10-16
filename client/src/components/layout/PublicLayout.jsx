import { Link, Outlet } from 'react-router';
import { Logo, ThemeToggle, buttonVariants } from '@/components/ui';

/** Публичные страницы: лендинг, приглашения. */
export function PublicLayout() {
  return (
    <div className="bg-grain flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="focus-ring mr-auto rounded-md" aria-label="Frame — на главную">
          <Logo />
        </Link>
        <ThemeToggle variant="icon" />
        <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Войти
        </Link>
        <Link to="/register" className={buttonVariants({ size: 'sm' })}>
          Начать
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
        <span>© {new Date().getFullYear()} Frame</span>
        <span>Пространство для творческих проектов</span>
      </footer>
    </div>
  );
}
