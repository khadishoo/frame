import { KeyRound } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { SettingsSection } from '../components/SettingsSection';

export default function AccountSettingsPage() {
  return (
    <SettingsSection title="Аккаунт" description="Смена пароля и удаление аккаунта.">
      <EmptyState
        icon={KeyRound}
        title="Безопасность аккаунта"
        description="Появится на этапе 5 — после авторизации."
      />
    </SettingsSection>
  );
}
