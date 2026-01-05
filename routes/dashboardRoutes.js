import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";
import { getDashboardData } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", requireAuth, requireStaffOrAdmin, getDashboardData);

export default router;
