import express from "express";

import { requireAuth } from "../middlewares/requireAuth.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";
import { createInvoice, getInvoices } from "../controllers/invoiceController.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";


const router = express.Router();

router.get("/", requireAuth, requireStaffOrAdmin, getInvoices);
router.post("/", requireAuth, requireStaffOrAdmin, createInvoice);
// router.get("/:id", requireAuth, requireStaffOrAdmin, getInvoiceById);
// router.delete("/:id", requireAuth, requireSuperAdmin, deleteInvoice);

export default router;