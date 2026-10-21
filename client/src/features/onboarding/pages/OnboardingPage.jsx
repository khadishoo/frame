import { useState } from 'react';
import { useNavigate } from 'react-router';
import { updateMe } from '@/api/users';
import { Alert, Button, Input, Logo } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { CreativeTypePicker } from '@/features/users/components/CreativeTypePicker';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { toast } from '@/lib/toast';

/** Онбординг после регистрации: имя и творческие типы → PATCH /users/me. */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? '');
  const [types, setTypes] = useState(user?.creativeTypes ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const nameError = name.trim() ? null : 'Введите имя';

  const save = async () => {
    if (nameError) return;
    setSaving(true);
    setError(null);
    try {
      const { user: updated } = await updateMe({ name: name.trim(), creativeTypes: types });
      useAuthStore.getState().setUser(updated);
      toast.success('Профиль готов', { description: 'Самое время создать первый проект' });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="bg-grain flex min-h-dvh flex-col items-center px-4 py-6 sm:py-10">
      <title>Знакомство · Frame</title>
      <Logo />

      <main className="flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 py-10">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm font-medium text-muted">Шаг 1 из 1 · можно изменить позже</p>
          <h1 className="text-2xl font-semibold text-fg sm:text-3xl">
            Добро пожаловать{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-muted">
            Чем вы занимаетесь? Так мы подберём цвета и подсказки для ваших проектов.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <Input
            label="Как к вам обращаться"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            error={nameError ?? undefined}
          />
        </div>

        <CreativeTypePicker value={types} onChange={setTypes} />

        {error && <Alert variant="danger">{error}</Alert>}

        <div className="flex flex-col-reverse items-center justify-center gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => navigate('/app', { replace: true })}>
            Пропустить
          </Button>
          <Button size="lg" onClick={save} loading={saving} disabled={Boolean(nameError)}>
            {types.length > 0 ? `Продолжить · выбрано ${types.length}` : 'Продолжить'}
          </Button>
        </div>
      </main>
    </div>
  );
}
