import { QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, MotionConfig } from 'framer-motion';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui';
import { queryClient } from '@/lib/queryClient';
import { AuthBootstrap } from './AuthBootstrap';
import { router } from './router';
import { ThemeProvider } from './ThemeProvider';
import { ThemeSync } from './ThemeSync';

// Движок анимаций грузится отдельно — в стартовый файл попадает только лёгкий m.*
const loadMotionFeatures = () => import('@/lib/motionFeatures').then((mod) => mod.default);

// Корень приложения: провайдеры оборачивают роутер
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user" — анимации отключаются при prefers-reduced-motion */}
      {/* strict: случайный motion.* вместо m.* (тянет весь движок в стартовый файл) — ошибка */}
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <ThemeProvider>
            <AuthBootstrap>
              <RouterProvider router={router} />
            </AuthBootstrap>
            <ThemeSync />
            <Toaster />
          </ThemeProvider>
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}
