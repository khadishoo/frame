import { Bell } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function NotificationsPage() {
  return (
    <PageStub
      title="Уведомления"
      description="Назначения, упоминания, комментарии и приближающиеся дедлайны."
      stage={'13 (v1.2)'}
      icon={Bell}
    />
  );
}
