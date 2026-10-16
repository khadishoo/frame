import { ThemeToggle } from '@/components/ui';
import { useThemeStore } from '@/lib/theme';
import { SettingsSection } from '../components/SettingsSection';

const resolvedLabel = { light: 'светлая', dark: 'тёмная' };

export default function AppearanceSettingsPage() {
  const preference = useThemeStore((state) => state.preference);
  const resolved = useThemeStore((state) => state.resolved);

  return (
    <SettingsSection
      title="Оформление"
      description="Тема сохраняется в этом браузере. Синхронизация с профилем — на этапе 5."
    >
      <div className="flex flex-col gap-3">
        <ThemeToggle showLabels className="w-fit max-w-full flex-wrap" />
        {preference === 'system' && (
          <p className="text-sm text-muted">
            Сейчас в системе — {resolvedLabel[resolved]}. Тема сменится автоматически вместе с
            настройками устройства.
          </p>
        )}
      </div>
    </SettingsSection>
  );
}
