import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAuth);
router.use(projectsRouter);

export default router;
