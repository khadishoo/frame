import { expect, test } from '@playwright/test';

/**
 * Сценарии 1–4 плана (часть 1.3) одной цепочкой — как их пройдёт новый пользователь:
 * регистрация → онбординг → проект → задачи → перетаскивание на доске → идея →
 * идея в проект → избранное → поиск → выход.
 */
test('новый пользователь: от регистрации до выхода', async ({ page }) => {
  // Уникальный email: база пересоздаётся при запуске, но локально сервер может быть переиспользован
  const email = `e2e-${Date.now()}@frame.test`;
  const password = 'e2e-password-123';

  await test.step('лендинг → регистрация', async () => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Начать' }).first().click();
    await expect(page).toHaveURL(/\/register$/);

    await page.getByLabel('Имя').fill('Алиса');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Пароль', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  });

  await test.step('онбординг: имя и тип творчества', async () => {
    await expect(page).toHaveURL(/\/app\/onboarding$/);
    await expect(page.getByRole('heading', { name: /Добро пожаловать/ })).toBeVisible();
    await page.getByLabel('Как к вам обращаться').fill('Алиса Иллюстратор');
    await page.getByRole('button', { name: /Музыка/ }).click();
    await page.getByRole('button', { name: /Продолжить · выбрано 1/ }).click();
  });

  await test.step('дашборд пустой — три шага онбординга', async () => {
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole('heading', { name: /Три шага/ })).toBeVisible();
  });

  await test.step('новый проект через модалку', async () => {
    await page.getByRole('button', { name: 'Создать проект' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Название').fill('Альбом «Северный ветер»');
    await dialog.getByRole('radio', { name: /Музыка/ }).click();
    await dialog.getByRole('button', { name: 'Создать проект' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Альбом «Северный ветер»' }),
    ).toBeVisible();
  });

  const column = (name) => page.getByRole('region', { name });

  await test.step('задачи на доске', async () => {
    await page.getByRole('tab', { name: /Доска/ }).click();
    const todo = column('К работе');
    await todo.getByRole('button', { name: 'Добавить задачу' }).click();
    // После Enter поле остаётся открытым — можно сразу вводить следующую
    const input = todo.getByRole('textbox', { name: /Новая задача/ });
    for (const title of ['Записать демо', 'Свести вокал']) {
      await input.fill(title);
      await input.press('Enter');
      await expect(todo.getByText(title)).toBeVisible();
    }
    await page.keyboard.press('Escape');
  });

  await test.step('перетаскивание карточки в «Готово» мышью', async () => {
    const card = column('К работе').getByRole('listitem').filter({ hasText: 'Записать демо' });
    const target = column('Готово');
    const from = await card.boundingBox();
    const to = await target.boundingBox();

    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    // dnd-kit начинает перетаскивание после сдвига на 5 px — идём шагами
    await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
    await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 20 });
    await page.mouse.up();

    await expect(target.getByText('Записать демо')).toBeVisible();
    await expect(column('К работе').getByText('Записать демо')).toHaveCount(0);

    // После перезагрузки — то же самое: ход сохранился на сервере
    await page.reload();
    await expect(column('Готово').getByText('Записать демо')).toBeVisible();
    // Прогресс проекта пересчитался: 1 из 2 задач
    await page.getByRole('tab', { name: /Обзор/ }).click();
    await expect(page.getByRole('progressbar', { name: 'Прогресс проекта: 50%' })).toBeVisible();
  });

  await test.step('быстрая идея по клавише N', async () => {
    await page.goto('/app/ideas');
    await expect(page.getByRole('heading', { level: 1, name: 'Идеи' })).toBeVisible();
    await page.keyboard.press('KeyN');
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Заголовок').fill('Комикс про кота-почтальона');
    await dialog.getByLabel('Текст').fill('Кот разносит письма по крышам. **Шесть страниц**.');
    await dialog.getByLabel('Текст').press('Control+Enter');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('link', { name: /Комикс про кота-почтальона/ })).toBeVisible();
  });

  await test.step('идея → проект', async () => {
    await page.getByRole('link', { name: /Комикс про кота-почтальона/ }).click();
    await expect(page).toHaveURL(/\/app\/ideas\/[0-9a-f-]+$/);
    await page.getByRole('button', { name: 'Ещё действия' }).click();
    await page.getByRole('menuitem', { name: 'Превратить в проект' }).click();
    const dialog = page.getByRole('dialog', { name: 'Превратить в проект' });
    await dialog.getByRole('radio', { name: /Рисунок/ }).click();
    await dialog.getByRole('button', { name: 'Создать проект' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Комикс про кота-почтальона' }),
    ).toBeVisible();
  });

  await test.step('проект в избранное → в сайдбаре и на странице «Избранное»', async () => {
    await page
      .getByRole('button', { name: /Добавить в избранное: Комикс про кота-почтальона/ })
      .click();
    await expect(
      page.getByRole('button', { name: /Комикс про кота-почтальона/, pressed: true }),
    ).toBeVisible();
    await page.goto('/app/favorites');
    await expect(
      page.getByRole('link', { name: /Комикс про кота-почтальона/ }).first(),
    ).toBeVisible();
  });

  await test.step('поиск по Ctrl+K находит задачу', async () => {
    await page.keyboard.press('Control+KeyK');
    const search = page.getByRole('combobox', { name: /Поиск/ });
    await expect(search).toBeFocused();
    await search.fill('вокал');
    const option = page.getByRole('option', { name: /Свести вокал/ });
    await expect(option).toBeVisible();
    await search.press('Enter');
    await expect(page).toHaveURL(/\/app\/projects\/[0-9a-f-]+\?tab=board&task=/);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  await test.step('выход', async () => {
    await page.getByRole('button', { name: /Меню пользователя/ }).click();
    await page.getByRole('menuitem', { name: 'Выйти' }).click();
    await expect(page).toHaveURL(/\/login$/);
    // Защищённые страницы больше недоступны
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login$/);
  });
});
