import { Router } from 'express';
import { BidController } from '../controllers/bid.controller';
import { authMiddleware, freelancerMiddleware } from '../middleware/auth';

const router = Router();

// Protected routes
router.post('/project/:projectId', authMiddleware, freelancerMiddleware, BidController.createBid);
router.get('/project/:projectId', authMiddleware, BidController.getProjectBids);
router.get('/freelancer/:freelancerId', authMiddleware, BidController.getFreelancerBids);
router.put('/:id', authMiddleware, BidController.updateBid);
router.delete('/:id', authMiddleware, BidController.deleteBid);
router.post('/:id/withdraw', authMiddleware, BidController.withdrawBid);

export default router;