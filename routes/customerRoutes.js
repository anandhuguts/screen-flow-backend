import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin.js";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { requireBusiness } from "../middlewares/requireBusiness.js";

const router = express.Router();

router.get("/", requireAuth,requireBusiness, getCustomers);
router.post("/", requireAuth, requireSuperAdmin,requireBusiness, createCustomer);
router.patch("/:id", requireAuth, requireSuperAdmin,requireBusiness, updateCustomer);
router.delete("/:id", requireAuth, requireSuperAdmin,requireBusiness, deleteCustomer);

export default router;
