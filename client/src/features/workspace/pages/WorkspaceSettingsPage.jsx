import { Users } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function WorkspaceSettingsPage() {
  return (
    <PageStub
      title="Настройки пространства"
      description="Участники, роли, приглашения и категории проектов."
      version="1.2"
      icon={Users}
    />
  );
}
