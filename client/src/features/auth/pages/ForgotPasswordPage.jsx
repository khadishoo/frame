import { KeyRound } from 'lucide-react';
import { AuthLink } from '../components/AuthForm';

// Сброс пароля по email требует отправки писем — в плане это v2.0 (email)
export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <title>Восстановление пароля · Frame</title>
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-2">
        <KeyRound className="size-5 text-muted" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-fg">Восстановление пароля</h1>
        <p className="text-sm text-muted">
          Сброс пароля по email появится позже, вместе с отправкой писем.
        </p>
      </div>
      <p className="text-sm text-muted">
        <AuthLink to="/login">Вернуться ко входу</AuthLink>
      </p>
    </div>
  );
}
