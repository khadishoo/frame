import { Cloud } from 'lucide-react';
import { ThemeToggle } from '@/components/ui';
import { useThemeStore } from '@/lib/theme';
import { SettingsSection } from '../components/SettingsSection';

const resolvedLabel = { light: 'светлая', dark: 'тёмная' };

export default function AppearanceSettingsPage() {
  const preference = useThemeStore((state) => state.preference);
  const resolved = useThemeStore((state) => state.resolved);

  return (
    <SettingsSection title="Оформление" description="Тема интерфейса.">
      <title>Оформление · Настройки · Frame</title>
      <div className="flex flex-col gap-3">
        <ThemeToggle showLabels className="w-fit max-w-full flex-wrap" />
        {preference === 'system' && (
          <p className="text-sm text-muted">
            Сейчас в системе — {resolvedLabel[resolved]}. Тема сменится автоматически вместе с
            настройками устройства.
          </p>
        )}
        <p className="flex items-start gap-2 text-sm text-muted">
          <Cloud className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Тема сохраняется в вашем профиле — на всех устройствах после входа будет одинаковой.
        </p>
      </div>
    </SettingsSection>
  );
}
