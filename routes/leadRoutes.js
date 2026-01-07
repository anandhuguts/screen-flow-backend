import express from "express";
import {
  addLeadNote,
  convertLead,
  createLead,
  deleteLead,
  getLeadNotes,
  getLeads,
  updateLead,
} from "../controllers/leadController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";
import { requireBusiness } from "../middlewares/requireBusiness.js";

const router = express.Router();

router.get("/", requireAuth, requireBusiness, getLeads);
router.post("/", requireAuth, requireBusiness, createLead);
router.patch("/:id", requireAuth, requireBusiness, updateLead);
router.delete("/:id", requireAuth, requireBusiness, requireSuperAdmin, deleteLead);
router.post("/:id/convert", requireAuth, requireBusiness, convertLead);

/* ✅ LEAD NOTES (FIXED) */
router.get("/:leadId/notes", requireAuth, requireBusiness, getLeadNotes);
router.post("/:leadId/notes", requireAuth, requireBusiness, addLeadNote);

export default router;
