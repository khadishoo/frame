import { Bell } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function NotificationsPage() {
  return (
    <PageStub
      title="Уведомления"
      description="Назначения, упоминания, комментарии и приближающиеся дедлайны."
      version="1.2"
      icon={Bell}
    />
  );
}
