import { CalendarDays } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function CalendarPage() {
  return (
    <PageStub
      title="Календарь"
      description="Задачи по дедлайнам: перетащите задачу на другой день, чтобы перенести срок."
      version="1.1"
      icon={CalendarDays}
    />
  );
}
