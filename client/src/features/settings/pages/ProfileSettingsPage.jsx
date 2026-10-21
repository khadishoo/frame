import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign } from 'lucide-react';
import { updateMe } from '@/api/users';
import { Alert, Avatar, Button, Input, Textarea } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { applyServerError } from '@/features/auth/serverErrors';
import { CreativeTypePicker } from '@/features/users/components/CreativeTypePicker';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { SettingsSection } from '../components/SettingsSection';
import { UnsavedChangesDialog } from '../components/UnsavedChangesDialog';
import { BIO_MAX, profileSchema } from '../schemas';

// Значения формы: null из API → '' в полях
const toFormValues = (user) => ({
  name: user.name,
  username: user.username ?? '',
  bio: user.bio ?? '',
  creativeTypes: user.creativeTypes ?? [],
});

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [formError, setFormError] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(user),
    mode: 'onTouched',
  });

  const blocker = useUnsavedChanges(isDirty && !isSubmitting);
  // useWatch (а не watch) — совместим с оптимизациями React Compiler
  const name = useWatch({ control, name: 'name' });
  const bioLength = useWatch({ control, name: 'bio' }).length;

  const onSubmit = handleSubmit(async ({ name, username, bio, creativeTypes }) => {
    setFormError(null);
    try {
      const { user: updated } = await updateMe({
        name,
        username: username || null,
        bio: bio.trim() || null,
        creativeTypes,
      });
      useAuthStore.getState().setUser(updated);
      reset(toFormValues(updated)); // сохранённое становится новой «точкой отсчёта»
      toast.success('Профиль сохранён');
    } catch (error) {
      setFormError(applyServerError(error, setError));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <title>Профиль · Настройки · Frame</title>

      <SettingsSection title="Профиль" description="Так вас увидят участники пространства.">
        <div className="flex items-center gap-4">
          <Avatar name={name.trim() || user.name} src={user.avatarUrl} size="xl" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate font-medium text-fg">{name.trim() || user.name}</p>
            <p className="text-sm text-muted">
              Аватар из инициалов — цвет подбирается по имени. Загрузка фото — в версии 1.1.
            </p>
          </div>
        </div>

        {formError && <Alert variant="danger">{formError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Имя"
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Username"
            leftIcon={AtSign}
            placeholder="anna_draws"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            hint="3–30 символов: латиница, цифры и _"
            error={errors.username?.message}
            {...register('username')}
          />
        </div>

        <div className="relative">
          <Textarea
            label="О себе"
            rows={3}
            placeholder="Пара слов о себе и своём творчестве"
            hint="Видно в профиле и рядом с вашими комментариями"
            error={errors.bio?.message}
            {...register('bio')}
          />
          {/* Счётчик символов — справа над полем */}
          <span
            className={cn(
              'absolute right-0 top-0 text-xs tabular-nums',
              bioLength > BIO_MAX ? 'font-medium text-danger' : 'text-muted',
            )}
            aria-live="polite"
          >
            {bioLength}/{BIO_MAX}
          </span>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Творческие направления"
        description="Подсказки и цвета новых проектов подстроятся под выбранное."
      >
        <Controller
          name="creativeTypes"
          control={control}
          render={({ field }) => (
            <CreativeTypePicker value={field.value} onChange={field.onChange} />
          )}
        />
      </SettingsSection>

      {/* Панель сохранения «прилипает» к низу экрана (на телефоне — над таб-баром).
          На узком экране — только кнопки в одну строку, статус читается скринридером */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-10 flex items-center gap-3 rounded-xl border border-border bg-surface/90 p-2 shadow-pop backdrop-blur-md sm:p-3 md:bottom-4">
        <p
          aria-live="polite"
          className={cn(
            'flex-1 px-1 text-sm max-sm:sr-only',
            isDirty ? 'font-medium text-fg' : 'text-muted',
          )}
        >
          {isDirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены'}
        </p>
        <div className="flex flex-1 gap-2 sm:flex-none">
          <Button
            variant="ghost"
            onClick={() => reset()}
            disabled={!isDirty || isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Отменить
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isDirty}
            className="flex-1 sm:flex-none"
          >
            Сохранить
          </Button>
        </div>
      </div>

      <UnsavedChangesDialog blocker={blocker} />
    </form>
  );
}
