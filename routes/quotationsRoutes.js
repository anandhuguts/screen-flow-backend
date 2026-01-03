import express from "express";

import { requireAuth } from "../middlewares/requireAuth.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";
import { createQuotation, deleteQuotation, getQuotations, updateQuotation } from "../controllers/quotationController.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";


const router = express.Router();

router.get("/", requireAuth, requireStaffOrAdmin, getQuotations);
router.post("/", requireAuth, requireStaffOrAdmin, createQuotation);
router.patch("/:id", requireAuth, requireStaffOrAdmin, updateQuotation);
router.delete("/:id", requireAuth, requireSuperAdmin, deleteQuotation);

export default router;