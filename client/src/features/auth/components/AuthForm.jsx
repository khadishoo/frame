import { Link } from 'react-router';
import { Alert } from '@/components/ui';

/** Общая «рамка» форм входа и регистрации: заголовок, ошибка формы, подвал со ссылкой. */
export function AuthForm({ title, description, formError, onSubmit, children, footer }) {
  return (
    <div className="flex flex-col gap-8">
      <title>{`${title} · Frame`}</title>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg">{title}</h1>
        <p className="text-sm text-muted">{description}</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && <Alert variant="danger">{formError}</Alert>}
        {children}
      </form>

      {footer && <p className="text-center text-sm text-muted">{footer}</p>}
    </div>
  );
}

/** Ссылка в подвале формы («Нет аккаунта? Зарегистрироваться»). */
export function AuthLink({ to, children, state }) {
  return (
    <Link
      to={to}
      state={state}
      className="focus-ring rounded font-medium text-fg underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
