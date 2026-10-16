# Frame

Веб-приложение для организации творческих проектов: рисунков, музыки, видео, фото,
сценариев, разработки. Собирайте идеи, планируйте задачи и доводите проекты до конца.

> 🚧 В разработке. Готовы каркас, UI-кит и layouts (этап 3 из [плана](PLAN.md)).

## Стек

**Клиент:** React, Vite, Tailwind CSS, React Router, TanStack Query, axios
**Сервер:** Node.js 22, Express, PostgreSQL 17, Knex, Zod, pino

## Локальный запуск

Требуется: Node.js 22+, PostgreSQL 17.

```powershell
# 1. База данных
psql -U postgres -c "CREATE DATABASE frame_dev ENCODING 'UTF8' TEMPLATE template0;"

# 2. Сервер (http://localhost:4000)
cd server
npm install
Copy-Item .env.example .env   # затем впишите пароль PostgreSQL в DATABASE_URL
npm run migrate
npm run dev

# 3. Клиент (http://localhost:5173) — в отдельном терминале
cd client
npm install
npm run dev
```

## Структура

```
client/   SPA на React (Vite)
server/   REST API на Express, миграции Knex
PLAN.md   план разработки по этапам
```
