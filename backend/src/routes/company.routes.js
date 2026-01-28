import { Router } from "express";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  companyIdParamSchema,
  companyQuestionParamsSchema,
  companySlugParamSchema,
  createCompanyBodySchema,
  createInterviewSetBodySchema,
  idParamSchema,
  paginationQuerySchema,
  updateCompanyBodySchema,
  updateInterviewSetBodySchema,
  upsertCompanyQuestionBodySchema,
} from "../validation/api.validation.js";
import {
  createCompany,
  deleteCompany,
  deleteCompanyQuestion,
  getCompanyBySlug,
  listCompanies,
  listCompanyQuestions,
  updateCompany,
  upsertCompanyQuestion,
} from "../controller/company.controller.js";
import {
  createInterviewSet,
  deleteInterviewSet,
  listInterviewSetsByCompany,
  updateInterviewSet,
} from "../controller/interviewSet.controller.js";

const router = Router();

router.get("/", validate({ query: paginationQuerySchema }), listCompanies);
router.get(
  "/:slug/questions",
  validate({ params: companySlugParamSchema }),
  listCompanyQuestions
);
router.get("/:slug", validate({ params: companySlugParamSchema }), getCompanyBySlug);

router.post(
  "/",
  authMiddleware,
  ensureAuthenticated,
  validate({ body: createCompanyBodySchema }),
  createCompany
);

router.patch(
  "/:id",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: idParamSchema, body: updateCompanyBodySchema }),
  updateCompany
);

router.delete(
  "/:id",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: idParamSchema }),
  deleteCompany
);

// Interview sets (scoped to companyId)
router.get(
  "/:companyId/interview-sets",
  validate({ params: companyIdParamSchema }),
  listInterviewSetsByCompany
);

router.post(
  "/:companyId/interview-sets",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: companyIdParamSchema, body: createInterviewSetBodySchema }),
  createInterviewSet
);

// Interview set by id (global)
router.patch(
  "/interview-sets/:id",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: idParamSchema, body: updateInterviewSetBodySchema }),
  updateInterviewSet
);

router.delete(
  "/interview-sets/:id",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: idParamSchema }),
  deleteInterviewSet
);

// CompanyQuestion mapping (global data, admin-ish)
router.put(
  "/:companyId/questions/:questionId",
  authMiddleware,
  ensureAuthenticated,
  validate({
    params: companyQuestionParamsSchema,
    body: upsertCompanyQuestionBodySchema,
  }),
  upsertCompanyQuestion
);

router.delete(
  "/:companyId/questions/:questionId",
  authMiddleware,
  ensureAuthenticated,
  validate({ params: companyQuestionParamsSchema }),
  deleteCompanyQuestion
);

export default router;

