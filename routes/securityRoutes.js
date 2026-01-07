import express from "express";
import { changePassword } from "../controllers/securityController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

/**
 * POST /api/security/change-password
 */
router.post("/change-password", requireAuth, changePassword);

export default router;
