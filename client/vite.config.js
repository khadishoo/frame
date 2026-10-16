import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // import Button from '@/components/ui/Button' вместо '../../../components/ui/Button'
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5180, // 5173 часто занят другими Vite-проектами
    strictPort: true,
    // Запросы /api/* в dev уходят на Express — браузер видит один origin, CORS не нужен
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
