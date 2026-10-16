import { UserPen } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { SettingsSection } from '../components/SettingsSection';

export default function ProfileSettingsPage() {
  return (
    <SettingsSection title="Профиль" description="Имя, username, аватар, о себе и творческие типы.">
      <EmptyState
        icon={UserPen}
        title="Редактирование профиля"
        description="Появится на этапе 5 — после авторизации."
      />
    </SettingsSection>
  );
}
