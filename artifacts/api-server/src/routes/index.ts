import { Router, type IRouter } from "express";
import healthRouter from "./health";
import payRouter from "./pay";

const router: IRouter = Router();

router.use(healthRouter);
router.use(payRouter);

export default router;
