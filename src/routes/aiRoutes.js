import { Router } from 'express';
import { improvePost } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { validateMongoId } from '../middleware/validate.js';

const router = Router();

// Improve content using Gemini AI and save as a new draft under the same user
router.post('/improve/:postId', authenticate, aiLimiter, validateMongoId('postId'), improvePost);

export default router;
