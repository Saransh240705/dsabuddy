import { Router } from "express";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createTagBodySchema, idParamSchema } from "../validation/api.validation.js";
import { createTag, deleteTag, listTags } from "../controller/tag.controller.js";

const router = Router();

router.get("/", listTags);

router.post(
  "/",
  authMiddleware,
  ensureAuthenticated,
  validate({ body: createTagBodySchema }),
  createTag
);

router.delete(
  "/:id",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: idParamSchema }),
  deleteTag
);

export default router;

