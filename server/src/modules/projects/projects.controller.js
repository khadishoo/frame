import { hasRole } from '../../middleware/access.js';
import { AppError } from '../../utils/AppError.js';
import * as projectsService from './projects.service.js';

export const list = async (req, res) => {
  res.json(await projectsService.listProjects(req.membership.workspaceId, req.validated.query));
};

export const create = async (req, res) => {
  const project = await projectsService.createProject(
    req.membership.workspaceId,
    req.user.id,
    req.validated.body,
  );
  res.status(201).json(project);
};

export const get = async (req, res) => {
  res.json(await projectsService.getProject(req.record.id));
};

export const update = async (req, res) => {
  res.json(await projectsService.updateProject(req.record, req.validated.body));
};

export const setTags = async (req, res) => {
  res.json(await projectsService.setProjectTags(req.record, req.validated.body.tagIds));
};

export const archive = async (req, res) => {
  res.json(await projectsService.setArchived(req.record, true));
};

export const restore = async (req, res) => {
  res.json(await projectsService.setArchived(req.record, false));
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
