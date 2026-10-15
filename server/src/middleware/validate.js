/**
 * Валидирует запрос по Zod-схеме вида z.object({ body?, params?, query? }).
 * Результат кладётся в req.validated (в Express 5 req.query только для чтения).
 * Ошибку ZodError превращает в ответ 400 errorHandler.
 *
 * Пример: router.post('/', validate(createProjectSchema), controller.create)
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    req.validated = await schema.parseAsync({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  } catch (err) {
    next(err);
  }
};
