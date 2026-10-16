import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui';

/** Временное содержимое страниц авторизации (формы появятся на этапе 4). */
export function AuthStub({ title, description, footer }) {
  return (
    <div className="flex flex-col gap-6">
      <title>{`${title} · Frame`}</title>
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-xl font-semibold text-fg">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-surface-2/50 px-4 py-5 text-center text-sm text-muted">
        Форма появится на этапе 4 (авторизация).
      </div>

      <Link to="/app" className={buttonVariants({ className: 'w-full' })}>
        Открыть приложение
      </Link>

      {footer && <p className="text-center text-sm text-muted">{footer}</p>}
    </div>
  );
}

/** Ссылка внизу карточки авторизации («Нет аккаунта? Зарегистрироваться»). */
export function AuthLink({ to, children }) {
  return (
    <Link
      to={to}
      className="focus-ring rounded font-medium text-fg underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
