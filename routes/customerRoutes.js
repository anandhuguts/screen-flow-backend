import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";


const router = express.Router();

router.get("/", requireAuth, requireStaffOrAdmin, getCustomers);
router.post("/", requireAuth, requireStaffOrAdmin, createCustomer);
router.patch("/:id", requireAuth, requireStaffOrAdmin, updateCustomer);
router.delete("/:id", requireAuth, requireStaffOrAdmin, deleteCustomer);

export default router;
