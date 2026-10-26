import { hasRole } from '../../middleware/access.js';
import { AppError } from '../../utils/AppError.js';
import { markFavorite, markFavorites } from '../favorites/favorites.service.js';
import * as projectsService from './projects.service.js';

// «В избранном» — своё у каждого пользователя, поэтому отметку ставит контроллер
const withFavorite = (req, project) => markFavorite(req.user.id, 'project', project);

export const list = async (req, res) => {
  const page = await projectsService.listProjects(req.membership.workspaceId, req.validated.query);
  res.json({ ...page, items: await markFavorites(req.user.id, 'project', page.items) });
};

export const create = async (req, res) => {
  const project = await projectsService.createProject(
    req.membership.workspaceId,
    req.user.id,
    req.validated.body,
  );
  res.status(201).json({ ...project, isFavorite: false });
};

export const get = async (req, res) => {
  res.json(await withFavorite(req, await projectsService.getProject(req.record.id)));
};

export const update = async (req, res) => {
  res.json(
    await withFavorite(req, await projectsService.updateProject(req.record, req.validated.body)),
  );
};

export const setTags = async (req, res) => {
  res.json(
    await withFavorite(
      req,
      await projectsService.setProjectTags(req.record, req.validated.body.tagIds),
    ),
  );
};

export const archive = async (req, res) => {
  res.json(await withFavorite(req, await projectsService.setArchived(req.record, true)));
};

export const restore = async (req, res) => {
  res.json(await withFavorite(req, await projectsService.setArchived(req.record, false)));
};

// Удалить можно свой проект; чужой — только владельцу или админу пространства (PLAN, этап 13)
export const remove = async (req, res) => {
  const isAuthor = req.record.created_by === req.user.id;
  if (!isAuthor && !hasRole(req.membership.role, 'admin')) {
    throw AppError.forbidden('Удалять чужие проекты могут только владелец и администраторы');
  }
  await projectsService.deleteProject(req.record);
  res.status(204).end();
};
