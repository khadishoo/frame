import { defineConfig, devices } from '@playwright/test';

// Свои порты, чтобы не мешать dev-серверам (4000 / 5180)
const API_PORT = 4100;
const WEB_PORT = 5190;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  // Тесты одной базы и одного лимита запросов на вход — по очереди
  workers: 1,
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: WEB_URL,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Пересоздаёт базу frame_e2e, применяет миграции и запускает API
      command: 'npm run e2e:server',
      cwd: '../server',
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: { PORT: String(API_PORT), CLIENT_URL: WEB_URL },
      reuseExistingServer: !CI,
      timeout: 60_000,
    },
    {
      // Прод-сборка клиента — то, что увидит пользователь
      command: `npm run build && npx vite preview --port ${WEB_PORT} --strictPort`,
      cwd: '../client',
      url: WEB_URL,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
