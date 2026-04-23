import { Router } from "express";
import * as ctrl from "../controllers/departmentController";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";

export const departmentsRouter = Router();

departmentsRouter.use(requireAuth);

departmentsRouter.get("/", ctrl.list);
departmentsRouter.get("/:id", ctrl.getOne);

departmentsRouter.post("/", requireRole("ADMIN"), ctrl.create);
departmentsRouter.patch("/:id", requireRole("ADMIN"), ctrl.update);
departmentsRouter.delete("/:id", requireRole("ADMIN"), ctrl.remove);