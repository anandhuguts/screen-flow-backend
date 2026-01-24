import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { requireBusiness } from '../middlewares/requireBusiness.js';
import { checkSubscription } from '../middlewares/checkSubscription.js';
import {
  sendInvitation,
  getPendingInvitations,
  verifyInvitationToken,
  acceptInvitation,
  cancelInvitation,
  resendInvitation
} from '../controllers/invitationController.js';

const router = express.Router();

// ========================================
// INVITATION ROUTES
// ========================================

// Public routes (no auth required)
router.get('/verify/:token', verifyInvitationToken);
router.post('/accept', acceptInvitation);

// Protected routes (require authentication and business context)
router.post('/', verifyToken, requireBusiness, checkSubscription, sendInvitation);
router.get('/pending', verifyToken, requireBusiness, getPendingInvitations);
router.delete('/:id', verifyToken, requireBusiness, cancelInvitation);
router.post('/:id/resend', verifyToken, requireBusiness, resendInvitation);

export default router;
