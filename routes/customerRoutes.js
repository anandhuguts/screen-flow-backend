import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { requireBusiness } from "../middlewares/requireBusiness.js";

const router = express.Router();

router.get("/", requireAuth, requireBusiness, getCustomers);
router.post("/", requireAuth, requireStaffOrAdmin, requireBusiness, createCustomer);
router.patch("/:id", requireAuth, requireStaffOrAdmin, requireBusiness, updateCustomer);
router.delete("/:id", requireAuth, requireStaffOrAdmin, requireBusiness, deleteCustomer);

export default router;
