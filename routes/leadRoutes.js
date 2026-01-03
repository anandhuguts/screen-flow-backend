import express from "express";
import { convertLead, createLead, deleteLead, getLeads, updateLead } from "../controllers/leadController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";
import { requireBusiness } from "../middlewares/requireBusiness.js";

const router = express.Router();

router.get("/", requireAuth,requireBusiness, getLeads);
router.post("/", requireAuth,requireBusiness, createLead);
router.patch("/:id", requireAuth,requireBusiness, updateLead);
router.delete("/:id", requireAuth,requireBusiness, requireSuperAdmin, deleteLead);
router.post("/:id/convert", requireAuth,requireBusiness, convertLead);
export default router;