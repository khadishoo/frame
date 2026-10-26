import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // import Button from '@/components/ui/Button' вместо '../../../components/ui/Button'
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Ядро, нужное на любой странице, — отдельным файлом: оно меняется редко и остаётся
        // в кэше браузера между релизами. Тяжёлое и редкое (dnd-kit, Markdown) сюда НЕ входит —
        // оно приезжает с чанками своих страниц.
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router|@tanstack|axios|zustand|clsx|tailwind-merge)[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 5180, // 5173 часто занят другими Vite-проектами
    strictPort: true,
    // Запросы /api/* в dev уходят на Express — браузер видит один origin, CORS не нужен
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
  // Vitest: компоненты тестируются в jsdom — «браузере» внутри Node
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
