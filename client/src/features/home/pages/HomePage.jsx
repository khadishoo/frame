import ThemeToggle from '@/components/ui/ThemeToggle';
import ApiStatus from '@/features/health/components/ApiStatus';

// Временная стартовая страница каркаса (этап 2). На этапе 3 её заменит лендинг.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-violet-600 dark:border-violet-400">
          <div className="h-8 w-8 rounded-md bg-violet-600 dark:bg-violet-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Frame</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Пространство для творческих проектов</p>
      </div>

      <ApiStatus />
      <ThemeToggle />
    </main>
  );
}
