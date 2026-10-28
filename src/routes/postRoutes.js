import { Router } from 'express';
import {
  createPost,
  getApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import {
  postCreateValidation,
  postUpdateValidation,
  validateMongoId,
} from '../middleware/validate.js';

const router = Router();

// Public explore endpoint - returns approved posts only
router.get('/', getApprovedPosts);

// Authenticated user posts and drafts - MUST be registered before /:id
router.get('/my-posts', authenticate, getMyPosts);

// Single post view (approved public, draft/pending author-only)
router.get('/:id', optionalAuthenticate, validateMongoId('id'), getPostById);

// Create a new post or draft
router.post('/', authenticate, postCreateValidation, createPost);

// Update own post (if approved post is edited, sent back to pending)
router.patch('/:id', authenticate, validateMongoId('id'), postUpdateValidation, updatePost);

// Delete own post
router.delete('/:id', authenticate, validateMongoId('id'), deletePost);

export default router;
