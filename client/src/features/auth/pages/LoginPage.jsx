import { AuthLink, AuthStub } from '../components/AuthStub';

export default function LoginPage() {
  return (
    <AuthStub
      title="С возвращением"
      description="Войдите, чтобы продолжить работу над проектами."
      footer={
        <>
          Нет аккаунта? <AuthLink to="/register">Зарегистрироваться</AuthLink>
          <br />
          <AuthLink to="/forgot-password">Забыли пароль?</AuthLink>
        </>
      }
    />
  );
}
