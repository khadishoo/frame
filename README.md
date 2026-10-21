# Frame

Веб-приложение для организации творческих проектов: рисунков, музыки, видео, фото,
сценариев, разработки. Собирайте идеи, планируйте задачи и доводите проекты до конца.

> 🚧 В разработке. Готовы каркас, UI-кит, layouts и API авторизации; следующий шаг — экраны входа.

## Стек

**Клиент:** React, Vite, Tailwind CSS, React Router, TanStack Query, axios
**Сервер:** Node.js 22, Express, PostgreSQL 17, Knex, Zod, pino, JWT + refresh-токены, argon2
**Тесты:** Vitest, Supertest

## Локальный запуск

Требуется: Node.js 22+, PostgreSQL 17.

```powershell
# 1. База данных
psql -U postgres -c "CREATE DATABASE frame_dev ENCODING 'UTF8' TEMPLATE template0;"

# 2. Зависимости (корень, server, client) и переменные окружения
npm run install:all
Copy-Item server/.env.example server/.env   # затем впишите пароль PostgreSQL в DATABASE_URL
npm run migrate --prefix server

# 3. Запуск сервера и клиента одной командой (из корня)
npm run dev

# Тесты API (база frame_test создаётся автоматически, нужен TEST_DATABASE_URL в server/.env)
npm run test
```

- Клиент: http://localhost:5180 (порт закреплён, `strictPort`)
- API: http://localhost:4000/api/v1/health

В логах строки сервера помечены `[API]`, клиента — `[WEB]`. Остановить оба — `Ctrl+C`.

## Структура

```
client/   SPA на React (Vite)
server/   REST API на Express, миграции Knex
```
