import { expect, test } from '@playwright/test';

/**
 * Демо-вход для посетителей портфолио: одна кнопка — и живой аккаунт с проектами,
 * задачами и графиком активности (данные из сида, e2e-server заливает его в чистую базу).
 */
test('«Войти как демо» открывает заполненный дашборд', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Войти как демо' }).click();

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { level: 1, name: /Мира/ })).toBeVisible();
  // Онбординга нет — у демо уже есть проекты, задачи и идеи
  await expect(page.getByRole('heading', { name: /Три шага/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Выполнено за неделю' })).toBeVisible();
  await expect(page.getByText('Иллюстрации к сказке «Лисья почта»').first()).toBeVisible();

  // Пароль демо сменить нельзя — сервер отвечает понятной ошибкой
  await page.goto('/app/settings/account');
  await page.getByLabel('Текущий пароль').fill('demo-password');
  await page.getByLabel('Новый пароль', { exact: true }).fill('hacked-password-1');
  await page.getByLabel('Повторите новый пароль').fill('hacked-password-1');
  await page.getByRole('button', { name: 'Сменить пароль' }).click();
  await expect(page.getByText(/В демо-аккаунте это недоступно/).first()).toBeVisible();
});
