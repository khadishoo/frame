import { FolderPlus } from 'lucide-react';
import { PageHeader } from '@/components/layout';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { toast } from '@/lib/toast';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

const widgets = ['Активные проекты', 'Задачи на неделю', 'Выполнено', 'Идеи'];

export default function DashboardPage() {
  const name = useAuthStore((s) => s.user?.name);

  return (
    <>
      <PageHeader
        title={name ? `${greeting()}, ${name}` : greeting()}
        description="Здесь будет сводка по вашим проектам. Дашборд появится на этапе 9."
      />

      {/* Будущие виджеты статистики — пока скелетоны */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {widgets.map((label) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4 shadow-soft">
            <p className="mb-3 text-sm text-muted">{label}</p>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      <EmptyState
        icon={FolderPlus}
        title="Пока ни одного проекта"
        description="Соберите идеи, референсы и задачи в одном месте — начните с первого проекта."
        action={
          <Button onClick={() => toast.info('Создание проектов — этап 6')}>
            Создать первый проект
          </Button>
        }
      />
    </>
  );
}
