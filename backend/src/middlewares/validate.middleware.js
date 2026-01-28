/*
 * Zod-based request validation middleware.
*/
export const validate = (schemas = {}) => {
  const { body, query, params } = schemas;

  return async (req, res, next) => {
    try {
      if (params) {
        const parsed = await params.safeParseAsync(req.params);
        if (!parsed.success) {
          return res.status(400).json({ error: parsed.error.format() });
        }
        req.params = parsed.data;
      }

      if (query) {
        const parsed = await query.safeParseAsync(req.query);
        if (!parsed.success) {
          return res.status(400).json({ error: parsed.error.format() });
        }
        req.query = parsed.data;
      }

      if (body) {
        const parsed = await body.safeParseAsync(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: parsed.error.format() });
        }
        req.body = parsed.data;
      }

      return next();
    } catch (err) {
      return res.status(500).json({ error: "Validation failed" });
    }
  };
};

