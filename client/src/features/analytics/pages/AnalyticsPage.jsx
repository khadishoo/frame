import { ChartColumn } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function AnalyticsPage() {
  return (
    <PageStub
      title="Аналитика"
      description="Выполненные задачи, серия дней и распределение по творческим типам."
      version="1.3"
      icon={ChartColumn}
    />
  );
}
