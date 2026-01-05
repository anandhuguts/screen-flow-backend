import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";

import { getBalanceSheet, getLedger, getProfitLoss, getTrialBalance } from "../controllers/accountController.js";
import { requireStaffOrAdmin } from "../middlewares/requireStaffOrAdmin.js";


const router = express.Router();
router.get("/ledger/:accountCode", requireAuth,requireStaffOrAdmin, getLedger);
router.get("/trial-balance", requireAuth,requireStaffOrAdmin, getTrialBalance);
router.get("/profit-loss", requireAuth,requireStaffOrAdmin, getProfitLoss);
router.get("/balance-sheet", requireAuth,requireStaffOrAdmin, getBalanceSheet);


export default router;
