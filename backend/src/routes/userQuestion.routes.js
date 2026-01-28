import { Router } from "express";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  listUserQuestionsQuerySchema,
  upsertUserQuestionBodySchema,
  userQuestionIdParamSchema,
} from "../validation/api.validation.js";
import {
  deleteMyQuestionStatus,
  listMyQuestionStatuses,
  upsertMyQuestionStatus,
} from "../controller/userQuestion.controller.js";

const router = Router();

router.use(authMiddleware, ensureAuthenticated);

router.get("/", validate({ query: listUserQuestionsQuerySchema }), listMyQuestionStatuses);

router.put(
  "/:questionId",
  validate({ params: userQuestionIdParamSchema, body: upsertUserQuestionBodySchema }),
  upsertMyQuestionStatus
);

router.delete(
  "/:questionId",
  validate({ params: userQuestionIdParamSchema }),
  deleteMyQuestionStatus
);

export default router;

