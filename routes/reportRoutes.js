import express from "express";
import {
  leadReport,
  salesSummary,
  paymentReport,
  outstandingReport,
} from "../controllers/ReportsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";

const router = express.Router();

router.get("/leads", requireAuth,requireStaffOrAdmin, leadReport);
router.get("/sales-summary", requireAuth,requireStaffOrAdmin, salesSummary);
router.get("/payments", requireAuth,requireStaffOrAdmin, paymentReport);
router.get("/outstanding", requireAuth,requireStaffOrAdmin, outstandingReport);

export default router;
