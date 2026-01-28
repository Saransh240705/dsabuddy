import { Router } from "express";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  platformParamSchema,
  upsertPlatformConnectionBodySchema,
} from "../validation/api.validation.js";
import {
  deleteMyPlatformConnection,
  listMyPlatformConnections,
  syncMyPlatformStats,
  upsertMyPlatformConnection,
} from "../controller/platformConnection.controller.js";

const router = Router();

router.use(authMiddleware, ensureAuthenticated);

router.get("/", listMyPlatformConnections);

router.put(
  "/:platform",
  validate({ params: platformParamSchema, body: upsertPlatformConnectionBodySchema }),
  upsertMyPlatformConnection
);

router.delete(
  "/:platform",
  validate({ params: platformParamSchema }),
  deleteMyPlatformConnection
);

router.post(
  "/:platform/sync",
  validate({ params: platformParamSchema }),
  syncMyPlatformStats
);

export default router;

