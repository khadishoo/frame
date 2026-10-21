/** Контроллер меток (категорий или тегов) поверх сервиса из createLabelService. */
export const createLabelController = (service) => ({
  list: async (req, res) => {
    res.json({ items: await service.list(req.membership.workspaceId) });
  },

  create: async (req, res) => {
    const label = await service.create(req.membership.workspaceId, req.validated.body);
    res.status(201).json(label);
  },

  update: async (req, res) => {
    res.json(await service.update(req.record.id, req.validated.body));
  },

  remove: async (req, res) => {
    await service.remove(req.record.id);
    res.status(204).end();
  },
});
