import { createHash } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Куда проксировать /api: по умолчанию dev-API; E2E поднимает свой на другом порту
const apiTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:4000';

/**
 * Content-Security-Policy для production-сборки — meta-тегом в index.html (в dev не ставим:
 * HMR Vite работает через инлайн-скрипты и WebSocket). Инлайн-скрипт темы разрешён по
 * sha256 — 'unsafe-inline' для скриптов не нужен. frame-ancestors в meta не работает —
 * его выставит хостинг заголовком (этап 11).
 */
function contentSecurityPolicy() {
  return {
    name: 'frame-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
          ([, code]) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`,
        );
        // API на другом домене (VITE_API_URL при деплое) — разрешаем запросы и туда
        const apiUrl = process.env.VITE_API_URL;
        const apiOrigin = apiUrl?.startsWith('http') ? ` ${new URL(apiUrl).origin}` : '';
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}`,
          "style-src 'self' https://fonts.googleapis.com",
          // style="…" у элементов: анимации framer-motion, позиции dnd-kit
          "style-src-attr 'unsafe-inline'",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https:",
          `connect-src 'self'${apiOrigin}`,
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');
        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
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
      '/api': { target: apiTarget, changeOrigin: true },
    },
  },
  // vite preview берёт proxy из server.proxy — прод-сборку можно открыть с живым API (E2E, Lighthouse)
  // Vitest: компоненты тестируются в jsdom — «браузере» внутри Node
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});
