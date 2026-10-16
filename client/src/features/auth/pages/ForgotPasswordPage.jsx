import { AuthLink, AuthStub } from '../components/AuthStub';

export default function ForgotPasswordPage() {
  return (
    <AuthStub
      title="Восстановление пароля"
      description="Пришлём ссылку для сброса пароля на вашу почту."
      footer={<AuthLink to="/login">Вернуться ко входу</AuthLink>}
    />
  );
}
