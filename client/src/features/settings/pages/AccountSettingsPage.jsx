import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Trash2 } from 'lucide-react';
import { changePassword, deleteMe } from '@/api/users';
import { Alert, Button, ConfirmDialog, Input, PasswordInput } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { applyServerError } from '@/features/auth/serverErrors';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/lib/toast';
import { SettingsSection } from '../components/SettingsSection';
import { changePasswordSchema } from '../schemas';

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ChangePasswordForm() {
  const email = useAuthStore((s) => s.user?.email);
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: emptyPasswords,
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setFormError(null);
    try {
      // Сервер отзывает все сессии и выдаёт этому устройству новую пару токенов
      const session = await changePassword({ currentPassword, newPassword });
      useAuthStore.getState().setSession(session);
      reset(emptyPasswords);
      toast.success('Пароль изменён', {
        description: 'На других устройствах нужно будет войти заново',
      });
    } catch (error) {
      setFormError(applyServerError(error, setError));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection
        title="Пароль"
        description="После смены пароля вы выйдете из аккаунта на всех других устройствах."
        footer={
          <Button type="submit" loading={isSubmitting}>
            Сменить пароль
          </Button>
        }
      >
        {formError && <Alert variant="danger">{formError}</Alert>}
        {/* Скрытое поле с логином помогает менеджерам паролей понять, чей это пароль */}
        <input type="email" autoComplete="username" value={email ?? ''} readOnly hidden />
        <PasswordInput
          label="Текущий пароль"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordInput
            label="Новый пароль"
            autoComplete="new-password"
            hint="Минимум 8 символов"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordInput
            label="Повторите новый пароль"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
      </SettingsSection>
    </form>
  );
}

function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const passwordRef = useRef(null);

  const close = () => {
    setOpen(false);
    setPassword('');
    setError(null);
  };

  const confirmDelete = async () => {
    setError(null);
    try {
      await deleteMe(password);
    } catch (err) {
      // Ошибку показываем под полем пароля; бросаем дальше — окно останется открытым
      let fieldMessage = null;
      const formMessage = applyServerError(err, (_field, { message }) => {
        fieldMessage = message;
      });
      setError(fieldMessage ?? formMessage);
      throw err;
    }
    queryClient.clear();
    toast.success('Аккаунт удалён', { description: 'Все ваши данные стёрты. Будем рады снова' });
    // ProtectedRoute увидит endReason 'deleted' и отправит на главную
    useAuthStore.getState().clearSession('deleted');
  };

  return (
    <SettingsSection
      tone="danger"
      title="Опасная зона"
      description="Удаление аккаунта необратимо: исчезнут профиль, личное пространство и все его проекты, задачи и заметки."
      footer={
        <Button variant="danger" leftIcon={<Trash2 />} onClick={() => setOpen(true)}>
          Удалить аккаунт
        </Button>
      }
    >
      <ConfirmDialog
        open={open}
        onClose={close}
        onConfirm={confirmDelete}
        danger
        title="Удалить аккаунт навсегда?"
        description="Это действие нельзя отменить. Для подтверждения введите пароль."
        confirmText="Удалить навсегда"
        confirmDisabled={!password}
        initialFocusRef={passwordRef}
      >
        <PasswordInput
          ref={passwordRef}
          label="Пароль"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />
      </ConfirmDialog>
    </SettingsSection>
  );
}

export default function AccountSettingsPage() {
  const email = useAuthStore((s) => s.user?.email);

  return (
    <>
      <title>Аккаунт · Настройки · Frame</title>
      <SettingsSection title="Email" description="Используется для входа.">
        <Input
          label="Email"
          type="email"
          value={email ?? ''}
          readOnly
          leftIcon={Mail}
          hint="Сменить email пока нельзя — появится вместе с подтверждением по почте"
          inputClassName="cursor-default bg-surface-2"
        />
      </SettingsSection>
      <ChangePasswordForm />
      <DeleteAccountSection />
    </>
  );
}
