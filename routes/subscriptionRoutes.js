import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { requireBusiness } from '../middlewares/requireBusiness.js';
import { checkSubscription } from '../middlewares/checkSubscription.js';
import {
  getSubscription,
  getAvailablePlans,
  requestUpgrade,
  requestDowngrade,
  getSubscriptionHistory,
  checkFeatureAccess,
  getCurrentUsage,
  recordPayment
} from '../controllers/subscriptionController.js';

const router = express.Router();

// ========================================
// SUBSCRIPTION ROUTES
// ========================================

// Public routes (no auth required)
router.get('/plans', getAvailablePlans);

// Protected routes (require authentication)
router.get('/current', verifyToken, requireBusiness, getSubscription);
router.get('/history', verifyToken, requireBusiness, checkSubscription, getSubscriptionHistory);
router.get('/usage', verifyToken, requireBusiness, checkSubscription, getCurrentUsage);
router.get('/feature-access', verifyToken, requireBusiness, checkSubscription, checkFeatureAccess);

// Plan changes
router.post('/upgrade', verifyToken, requireBusiness, checkSubscription, requestUpgrade);
router.post('/downgrade', verifyToken, requireBusiness, checkSubscription, requestDowngrade);

// Payment recording
router.post('/payments', verifyToken, requireBusiness, checkSubscription, recordPayment);

export default router;
