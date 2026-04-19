import { Router } from "express";
import * as authController from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

authRouter.post("/signup", authController.signup);
authRouter.post("/login", authController.login);
authRouter.post("/logout", requireAuth, authController.logout);
authRouter.get("/me", requireAuth, authController.me);