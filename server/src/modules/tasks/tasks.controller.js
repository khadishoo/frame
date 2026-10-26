import * as tasksService from './tasks.service.js';

// req.record — проект (маршруты /projects/:id/tasks) или задача (/tasks/:id)

export const listForProject = async (req, res) => {
  res.json(await tasksService.listProjectTasks(req.record.id, req.validated.query));
};

export const listForWorkspace = async (req, res) => {
  res.json(
    await tasksService.listWorkspaceTasks(
      req.membership.workspaceId,
      req.user.id,
      req.validated.query,
    ),
  );
};

export const create = async (req, res) => {
  const task = await tasksService.createTask(req.record, req.user.id, req.validated.body);
  res.status(201).json(task);
};

export const get = async (req, res) => {
  res.json(await tasksService.getTask(req.record.id));
};

export const update = async (req, res) => {
  res.json(await tasksService.updateTask(req.record, req.validated.body));
};

export const move = async (req, res) => {
  res.json(await tasksService.moveTask(req.record, req.validated.body));
};

export const remove = async (req, res) => {
  await tasksService.deleteTask(req.record);
  res.status(204).end();
};
