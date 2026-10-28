import { Router } from 'express';
import {
  getPendingPosts,
  approvePost,
  rejectPost,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { validateMongoId } from '../middleware/validate.js';

const router = Router();

// Protect all admin routes: must be authenticated and have role === 'admin'
router.use(authenticate, requireAdmin);

// View posts awaiting approval
router.get('/posts/pending', getPendingPosts);

// Approve a pending post
router.patch('/posts/approve/:id', validateMongoId('id'), approvePost);

// Reject a pending post
router.patch('/posts/reject/:id', validateMongoId('id'), rejectPost);

export default router;
