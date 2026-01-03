import express from "express";
import {
  createStaff,
  getAllStaff,
  deactivateStaff,
} from "../controllers/staffController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";

const router = express.Router();

// Create staff
router.post(
  "/create",
  requireAuth,
  requireSuperAdmin,
  createStaff
);

// Get all staff
router.get(
  "/",
  requireAuth,
  requireSuperAdmin,
  getAllStaff
);

// Deactivate staff
router.delete(
  "/:staffId",
  requireAuth,
  requireSuperAdmin,
  deactivateStaff
);

export default router;
