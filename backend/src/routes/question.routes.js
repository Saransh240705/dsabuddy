import { Router } from "express";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createQuestionBodySchema,
  listQuestionsQuerySchema,
  questionIdParamSchema,
  updateQuestionBodySchema,
} from "../validation/api.validation.js";
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  listQuestions,
  updateQuestion,
} from "../controller/question.controller.js";

const router = Router();

// Public endpoints with optional auth (for returning userStatuses)
router.get("/", authMiddleware, validate({ query: listQuestionsQuerySchema }), listQuestions);
router.get("/:id", authMiddleware, validate({ params: questionIdParamSchema }), getQuestionById);

// Protected (data-management)
router.post(
  "/",
  authMiddleware,
  ensureAuthenticated,
  validate({ body: createQuestionBodySchema }),
  createQuestion
);

router.patch(
  "/:id",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: questionIdParamSchema, body: updateQuestionBodySchema }),
  updateQuestion
);

router.delete(
  "/:id",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: questionIdParamSchema }),
  deleteQuestion
);

export default router;

