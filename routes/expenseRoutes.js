import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";
import {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    approveExpense,
    rejectExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

router.get("/", requireAuth, requireStaffOrAdmin, getExpenses);
router.post("/", requireAuth, requireStaffOrAdmin, createExpense);
router.put("/:id", requireAuth, requireStaffOrAdmin, updateExpense);
router.delete("/:id", requireAuth, requireStaffOrAdmin, deleteExpense);
router.post("/:id/approve", requireAuth, requireStaffOrAdmin, approveExpense);
router.post("/:id/reject", requireAuth, requireStaffOrAdmin, rejectExpense);

export default router;
