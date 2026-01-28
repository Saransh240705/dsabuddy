import { Router } from "express";
import {
  login,
  logoutUser,
  me,
  signup,
  updatePassword,
} from "../controller/auth.controller.js";
import { authMiddleware, ensureAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', authMiddleware, ensureAuthenticated, logoutUser);
router.get('/me', authMiddleware, ensureAuthenticated, me);
router.post('/update-password', authMiddleware, ensureAuthenticated, updatePassword);

export default router;
