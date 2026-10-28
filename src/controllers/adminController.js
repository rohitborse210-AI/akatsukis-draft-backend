import { Post } from '../models/Post.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getPendingPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { status: 'pending' };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: 1 }) // oldest first for review queue
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Pending posts fetched successfully.', posts, 200, {
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approvePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    if (post.status === 'approved') {
      return sendError(res, 'Post is already approved.', 400);
    }

    if (post.status === 'draft') {
      return sendError(res, 'Cannot approve a post that is currently saved as a draft. The author must submit it for review first.', 400);
    }

    post.status = 'approved';
    post.rejectionReason = null;

    await post.save();
    await post.populate('createdBy', 'name email role');

    return sendSuccess(res, 'Post approved successfully.', post);
  } catch (error) {
    next(error);
  }
};

export const rejectPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    if (post.status === 'draft') {
      return sendError(res, 'Cannot reject a post that is still a draft.', 400);
    }

    const { rejectionReason } = req.body;

    post.status = 'rejected';
    post.rejectionReason = rejectionReason || 'Content does not meet publication standards.';

    await post.save();
    await post.populate('createdBy', 'name email role');

    return sendSuccess(res, 'Post rejected successfully.', post);
  } catch (error) {
    next(error);
  }
};
