import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { markFavorites } from '../favorites/favorites.service.js';
import { getDashboard } from './dashboard.service.js';

// Часовой пояс IANA («Europe/Moscow»): от него зависит, где кончается «сегодня»
const isTimeZone = (tz) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

export const dashboardSchema = z.object({
  query: z.object({
    tz: z.string().max(64).refine(isTimeZone, { error: 'Неизвестный часовой пояс' }).default('UTC'),
  }),
});

/** /workspaces/:wsId/dashboard — после loadWorkspace. */
export const dashboardRouter = Router({ mergeParams: true });

dashboardRouter.get(
  '/',
  validate(dashboardSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = await getDashboard(req.membership.workspaceId, userId, req.validated.query);
    const [recentProjects, recentNotes] = await Promise.all([
      markFavorites(userId, 'project', data.recentProjects),
      markFavorites(userId, 'note', data.recentNotes),
    ]);
    res.json({ ...data, recentProjects, recentNotes });
  }),
);
