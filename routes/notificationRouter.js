import express from "express";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationsController.js";

import { requireAuth } from "../middlewares/requireAuth.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";

const router = express.Router();

/**
 * 🔐 All notification routes require authentication
 */


/**
 * 📥 Get notifications (paginated)
 * GET /api/notifications?page=1&limit=20
 */
router.get("/",requireAuth,requireStaffOrAdmin, getNotifications);

/**
 * 🔢 Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get("/unread-count",requireAuth,requireStaffOrAdmin, getUnreadNotificationCount);

/**
 * ✅ Mark single notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read",requireAuth,requireStaffOrAdmin, markNotificationRead);

/**
 * ✅ Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch("/read-all",requireAuth,requireStaffOrAdmin, markAllNotificationsRead);

export default router;
