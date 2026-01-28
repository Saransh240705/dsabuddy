import { Router } from "express";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  paginationQuerySchema,
  updateMeBodySchema,
  userNameParamSchema,
} from "../validation/api.validation.js";
import {
  getLeaderboard,
  getUserByUserName,
  updateMe,
} from "../controller/user.controller.js";

const router = Router();

router.get(
  "/leaderboard",
  validate({ query: paginationQuerySchema }),
  getLeaderboard
);

router.get("/:userName", validate({ params: userNameParamSchema }), getUserByUserName);

router.patch(
  "/me",
  authMiddleware,
  ensureAuthenticated,
  validate({ body: updateMeBodySchema }),
  updateMe
);

export default router;
