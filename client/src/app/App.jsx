import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui';
import { queryClient } from '@/lib/queryClient';
import { AuthBootstrap } from './AuthBootstrap';
import { router } from './router';
import { ThemeProvider } from './ThemeProvider';

// Корень приложения: провайдеры оборачивают роутер
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user" — анимации отключаются при prefers-reduced-motion */}
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <AuthBootstrap>
            <RouterProvider router={router} />
          </AuthBootstrap>
          <Toaster />
        </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
