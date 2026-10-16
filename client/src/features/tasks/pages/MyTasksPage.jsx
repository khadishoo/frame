import { ListChecks } from 'lucide-react';
import { PageStub } from '@/components/layout';

export default function MyTasksPage() {
  return (
    <PageStub
      title="Мои задачи"
      description="Просроченные, на сегодня, на неделю и позже — во всех проектах."
      stage={7}
      icon={ListChecks}
    />
  );
}
