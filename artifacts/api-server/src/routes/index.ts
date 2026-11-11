import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import projectsRouter from "./projects.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAuth);
router.use(projectsRouter);

export default router;
