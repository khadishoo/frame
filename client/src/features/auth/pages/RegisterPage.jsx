import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, User } from 'lucide-react';
import * as authApi from '@/api/auth';
import { Button, Input, PasswordInput } from '@/components/ui';
import { useAuthStore } from '../authStore';
import { AuthForm, AuthLink } from '../components/AuthForm';
import { registerSchema } from '../schemas';
import { applyServerError } from '../serverErrors';

export default function RegisterPage() {
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const session = await authApi.register(values);
      // После регистрации — онбординг (GuestRoute выполнит переход)
      useAuthStore.getState().setSession(session, { redirectTo: '/app/onboarding' });
    } catch (error) {
      setFormError(applyServerError(error, setError));
    }
  });

  return (
    <AuthForm
      title="Создать аккаунт"
      description="Соберите все творческие проекты в одном месте. Это бесплатно."
      formError={formError}
      onSubmit={onSubmit}
      footer={
        <>
          Уже есть аккаунт? <AuthLink to="/login">Войти</AuthLink>
        </>
      }
    >
      <Input
        label="Имя"
        autoComplete="name"
        leftIcon={User}
        placeholder="Как к вам обращаться"
        autoFocus
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        leftIcon={Mail}
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordInput
        label="Пароль"
        autoComplete="new-password"
        placeholder="Минимум 8 символов"
        hint="Не короче 8 символов. Лучше — фраза из нескольких слов"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" size="lg" loading={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? 'Создаём аккаунт…' : 'Создать аккаунт'}
      </Button>
    </AuthForm>
  );
}
