import { LogoMark } from '@/components/ui';

/**
 * Экран, пока восстанавливается сессия. Появляется с задержкой 150 мс:
 * если refresh быстрый, пользователь вообще его не заметит — без мигания.
 */
export function SplashScreen() {
  return (
    <div
      role="status"
      className="flex min-h-dvh animate-[splash-in_300ms_ease-out_150ms_both] items-center justify-center bg-bg"
    >
      <LogoMark className="size-12 text-fg motion-safe:animate-pulse" title="" />
      <span className="sr-only">Загрузка Frame…</span>
    </div>
  );
}
