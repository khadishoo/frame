import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'react-router';
import { Mail } from 'lucide-react';
import * as authApi from '@/api/auth';
import { Button, Input, PasswordInput } from '@/components/ui';
import { useAuthStore } from '../authStore';
import { AuthForm, AuthLink } from '../components/AuthForm';
import { loginSchema } from '../schemas';
import { applyServerError } from '../serverErrors';

export default function LoginPage() {
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched', // ошибка поля появляется после того, как из него ушли
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session = await authApi.login(values);
      // Дальше GuestRoute сам вернёт туда, куда пользователь шёл (state.from)
      useAuthStore.getState().setSession(session);
    } catch (error) {
      setFormError(applyServerError(error, setError));
    }
  });

  return (
    <AuthForm
      title="С возвращением"
      description="Войдите, чтобы продолжить работу над проектами."
      formError={formError}
      onSubmit={onSubmit}
      footer={
        <>
          Нет аккаунта?{' '}
          <AuthLink to="/register" state={location.state}>
            Зарегистрироваться
          </AuthLink>
        </>
      }
    >
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        leftIcon={Mail}
        placeholder="you@example.com"
        autoFocus
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordInput
        label="Пароль"
        autoComplete="current-password"
        placeholder="Ваш пароль"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? 'Входим…' : 'Войти'}
      </Button>
    </AuthForm>
  );
}
