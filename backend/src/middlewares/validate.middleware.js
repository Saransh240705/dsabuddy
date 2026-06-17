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
        Object.defineProperty(req, 'params', {
          value: parsed.data,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }

      if (query) {
        const parsed = await query.safeParseAsync(req.query);
        if (!parsed.success) {
          return res.status(400).json({ error: parsed.error.format() });
        }
        Object.defineProperty(req, 'query', {
          value: parsed.data,
          writable: true,
          configurable: true,
          enumerable: true
        });
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
      console.error("Validation middleware error:", err);
      return res.status(500).json({ error: "Validation failed" });
    }
  };
};

