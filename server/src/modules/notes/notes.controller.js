import { hasRole } from '../../middleware/access.js';
import { AppError } from '../../utils/AppError.js';
import { markFavorite, markFavorites } from '../favorites/favorites.service.js';
import * as notesService from './notes.service.js';

export const list = async (req, res) => {
  const page = await notesService.listNotes(req.membership.workspaceId, req.validated.query);
  res.json({ ...page, items: await markFavorites(req.user.id, 'note', page.items) });
};

export const create = async (req, res) => {
  const note = await notesService.createNote(
    req.membership.workspaceId,
    req.user.id,
    req.validated.body,
  );
  res.status(201).json({ ...note, isFavorite: false });
};

export const get = async (req, res) => {
  res.json(await markFavorite(req.user.id, 'note', await notesService.getNote(req.record.id)));
};

export const update = async (req, res) => {
  const note = await notesService.updateNote(req.record, req.validated.body);
  res.json(await markFavorite(req.user.id, 'note', note));
};

// Как у проектов: свою заметку удаляет автор, чужую — владелец или админ пространства
export const remove = async (req, res) => {
  const isAuthor = req.record.author_id === req.user.id;
  if (!isAuthor && !hasRole(req.membership.role, 'admin')) {
    throw AppError.forbidden('Удалять чужие заметки могут только владелец и администраторы');
  }
  await notesService.deleteNote(req.record);
  res.status(204).end();
};

export const convert = async (req, res) => {
  const { project, note } = await notesService.convertNote(
    req.record,
    req.user.id,
    req.validated.body,
  );
  res.status(201).json({
    project: { ...project, isFavorite: false },
    note: await markFavorite(req.user.id, 'note', note),
  });
};
