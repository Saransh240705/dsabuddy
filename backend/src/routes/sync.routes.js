import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import { syncProblemsBodySchema, idParamSchema } from "../validation/api.validation.js";
import { getSyncJob, startSyncProblems } from "../controller/sync.controller.js";

const router = Router();

router.post("/problems", validate({ body: syncProblemsBodySchema }), startSyncProblems);
router.get("/jobs/:id", validate({ params: idParamSchema }), getSyncJob);

export default router;

