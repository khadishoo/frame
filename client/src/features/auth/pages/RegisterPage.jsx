import { AuthLink, AuthStub } from '../components/AuthStub';

export default function RegisterPage() {
  return (
    <AuthStub
      title="Создать аккаунт"
      description="Соберите все творческие проекты в одном месте."
      footer={
        <>
          Уже есть аккаунт? <AuthLink to="/login">Войти</AuthLink>
        </>
      }
    />
  );
}
