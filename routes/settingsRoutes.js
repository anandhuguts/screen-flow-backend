import express from "express";
import {
  getCompany,
  updateCompany,
  getProfile,
  updateProfile,
  getUsers,
  getNotifications,
  updateNotifications,
} from "../controllers/settingsController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";

const router = express.Router();

router.get("/company", requireAuth,requireSuperAdmin, getCompany);
router.put("/company", requireAuth,requireSuperAdmin, updateCompany);

router.get("/profile", requireAuth,requireSuperAdmin, getProfile);
router.put("/profile", requireAuth,requireSuperAdmin, updateProfile);

router.get("/users", requireAuth,requireSuperAdmin, getUsers);

router.get("/notifications", requireAuth,requireSuperAdmin, getNotifications);
router.put("/notifications", requireAuth,requireSuperAdmin, updateNotifications);

export default router;
