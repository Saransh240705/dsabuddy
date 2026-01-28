import { Router } from "express";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  incrementDailyActivityBodySchema,
  listDailyActivityQuerySchema,
} from "../validation/api.validation.js";
import {
  incrementMyDailyActivity,
  listMyDailyActivity,
} from "../controller/dailyActivity.controller.js";

const router = Router();

router.use(authMiddleware, ensureAuthenticated);

router.get("/", validate({ query: listDailyActivityQuerySchema }), listMyDailyActivity);
router.post(
  "/increment",
  validate({ body: incrementDailyActivityBodySchema }),
  incrementMyDailyActivity
);

export default router;

