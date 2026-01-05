import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";
import { getPayments, recordPayment } from "../controllers/paymentsController.js";

const router = express.Router();

router.get("/", requireAuth, requireStaffOrAdmin, getPayments);
router.post("/", requireAuth, requireStaffOrAdmin, recordPayment);

export default router;
