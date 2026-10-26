import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { apiRouter } from './routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// app.js только собирает приложение и не слушает порт — так его удобно тестировать Supertest'ом
export const app = express();

app.disable('x-powered-by');

// API отдаёт только JSON — ему не нужны ни скрипты, ни стили, ни встраивание в чужие страницы.
// Самая строгая CSP: если ответ API всё же откроют как страницу, браузер ничего в нём не выполнит.
// CSP самого SPA — в client/vite.config.js (meta-тег в production-сборке).
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  }),
);
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.use('/api/v1', apiRouter);

app.use(notFound);
app.use(errorHandler);
