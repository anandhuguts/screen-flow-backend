import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { requireSystemSuperadmin } from '../middlewares/requireSystemSuperadmin.js';
import {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusinessSubscription,
  suspendBusiness,
  activateBusiness,
  getPlatformStatistics,
  getAllPlans,
  updatePlan,
  getAllInvitations
} from '../controllers/superadminController.js';

const router = express.Router();

// ========================================
// SYSTEM SUPERADMIN ROUTES
// All routes require system_superadmin role
// ========================================

// Platform statistics
router.get('/statistics', verifyToken, requireSystemSuperadmin, getPlatformStatistics);

// Business management
router.post('/businesses', verifyToken, requireSystemSuperadmin, createBusiness);
router.get('/businesses', verifyToken, requireSystemSuperadmin, getAllBusinesses);
router.get('/businesses/:id', verifyToken, requireSystemSuperadmin, getBusinessById);

// Subscription management
router.patch('/businesses/:id/subscription', verifyToken, requireSystemSuperadmin, updateBusinessSubscription);

// Business status control
router.post('/businesses/:id/suspend', verifyToken, requireSystemSuperadmin, suspendBusiness);
router.post('/businesses/:id/activate', verifyToken, requireSystemSuperadmin, activateBusiness);

// Plan Management
router.get('/plans', verifyToken, requireSystemSuperadmin, getAllPlans);
router.patch('/plans/:type', verifyToken, requireSystemSuperadmin, updatePlan);

// Invitation Monitoring
router.get('/invitations', verifyToken, requireSystemSuperadmin, getAllInvitations);

export default router;
