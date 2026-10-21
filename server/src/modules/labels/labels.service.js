import { db } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';

export const toLabel = (row) => ({
  id: row.id,
  name: row.name,
  color: row.color,
  ...(row.project_count !== undefined && { projectCount: Number(row.project_count) }),
});

/**
 * Сервис «меток» — категорий и тегов. Они устроены одинаково: название, цвет,
 * уникальность названия в пределах пространства (без учёта регистра).
 *
 * table — 'categories' | 'tags'; projectCount — сколько проектов (без архива) с этой меткой.
 */
export const createLabelService = ({ table, duplicateCode, duplicateMessage }) => {
  // Сколько активных проектов ссылается на метку: у категорий — projects.category_id,
  // у тегов — связь через project_tags
  const projectCount =
    table === 'categories'
      ? db('projects as p').count('*').whereRaw('p.category_id = l.id').whereNull('p.archived_at')
      : db('project_tags as pt')
          .join('projects as p', 'p.id', 'pt.project_id')
          .count('*')
          .whereRaw('pt.tag_id = l.id')
          .whereNull('p.archived_at');

  // Нарушение уникальности имени → 409 с ошибкой у поля name
  const withDuplicateCheck = async (query) => {
    try {
      return await query;
    } catch (err) {
      if (err.code === '23505') {
        throw new AppError(409, duplicateCode, duplicateMessage, [
          { path: 'body.name', message: duplicateMessage },
        ]);
      }
      throw err;
    }
  };

  return {
    list: async (workspaceId) => {
      const rows = await db(`${table} as l`)
        .where('l.workspace_id', workspaceId)
        .select('l.*', projectCount.clone().as('project_count'))
        .orderBy('l.position')
        .orderBy('l.created_at');
      return rows.map(toLabel);
    },

    create: async (workspaceId, { name, color }) => {
      // Новая метка — в конец списка
      const position = db(table)
        .where({ workspace_id: workspaceId })
        .select(db.raw('coalesce(max(position) + 1, 0)'));
      const [row] = await withDuplicateCheck(
        db(table).insert({ workspace_id: workspaceId, name, color, position }).returning('*'),
      );
      return toLabel({ ...row, project_count: 0 });
    },

    update: async (id, changes) => {
      const [row] = await withDuplicateCheck(
        db(table).where({ id }).update(changes).returning('*'),
      );
      return toLabel(row);
    },

    // Категория: у проектов category_id → NULL (ON DELETE SET NULL); тег: связи удалятся каскадом
    remove: (id) => db(table).where({ id }).del(),
  };
};

/**
 * Проверка, что все id меток принадлежат пространству. Иначе — 400 с ошибкой у поля:
 * к своему проекту нельзя привязать чужую категорию или тег (и узнать, существуют ли они).
 */
export const assertLabelsInWorkspace = async (trx, table, ids, workspaceId, field, message) => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return;

  const found = await trx(table).whereIn('id', unique).andWhere('workspace_id', workspaceId);
  if (found.length !== unique.length) {
    throw new AppError(400, 'VALIDATION_ERROR', message, [{ path: `body.${field}`, message }]);
  }
};
