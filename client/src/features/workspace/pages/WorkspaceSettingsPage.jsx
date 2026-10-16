import { Users } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function WorkspaceSettingsPage() {
  return (
    <PageStub
      title="Настройки пространства"
      description="Участники, роли, приглашения и категории проектов."
      stage={'13 (v1.2)'}
      icon={Users}
    />
  );
}
