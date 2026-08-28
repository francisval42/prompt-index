import { Router, type IRouter } from "express";
import healthRouter from "./health";
import payRouter from "./pay";
import newsletterRouter from "./newsletter";

const router: IRouter = Router();

router.use(healthRouter);
router.use(payRouter);
router.use(newsletterRouter);

export default router;
