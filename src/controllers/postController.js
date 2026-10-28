import { Post } from '../models/Post.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createPost = async (req, res, next) => {
  try {
    const { title, description, content, image, category, status } = req.body;

    // Ordinary users cannot directly create approved or rejected posts
    if (status && !['draft', 'pending'].includes(status)) {
      return sendError(res, 'New posts can only be created with "draft" or "pending" status.', 400);
    }

    const post = new Post({
      title,
      description,
      content,
      image: image || null,
      category,
      status: status || 'draft',
      createdBy: req.user._id,
    });

    await post.save();
    await post.populate('createdBy', 'name email role');

    return sendSuccess(res, 'Post created successfully.', post, 201);
  } catch (error) {
    next(error);
  }
};

export const getApprovedPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { status: 'approved' };

    if (req.query.category) {
      query.category = { $regex: new RegExp(`^${req.query.category.trim()}$`, 'i') };
    }

    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'Approved posts fetched successfully.', posts, 200, {
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

export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('createdBy', 'name email role');
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    // If approved, public can view
    if (post.status === 'approved') {
      return sendSuccess(res, 'Post fetched successfully.', post);
    }

    // If not approved, only the author or an admin can access it
    const isAuthenticated = Boolean(req.user);
    const isOwner = isAuthenticated && post.createdBy._id.equals(req.user._id);
    const isAdmin = isAuthenticated && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(
        res,
        'Access denied. This post is not publicly accessible.',
        403
      );
    }

    return sendSuccess(res, 'Post fetched successfully.', post);
  } catch (error) {
    next(error);
  }
};

export const getMyPosts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { createdBy: req.user._id };

    if (req.query.status) {
      if (['draft', 'pending', 'approved', 'rejected'].includes(req.query.status)) {
        query.status = req.query.status;
      }
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('createdBy', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return sendSuccess(res, 'User posts fetched successfully.', posts, 200, {
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

export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    // Must be the post owner
    if (!post.createdBy.equals(req.user._id)) {
      return sendError(res, 'Access denied. You can only update your own posts.', 403);
    }

    const { title, description, content, image, category, status } = req.body;

    // Ordinary users cannot directly approve or reject posts
    if (status && !['draft', 'pending'].includes(status)) {
      return sendError(res, 'Users can only set post status to "draft" or "pending".', 400);
    }

    // Check if content fields are being modified
    const hasContentChanges =
      (title !== undefined && title !== post.title) ||
      (description !== undefined && description !== post.description) ||
      (content !== undefined && content !== post.content) ||
      (image !== undefined && image !== post.image) ||
      (category !== undefined && category !== post.category);

    if (title !== undefined) post.title = title;
    if (description !== undefined) post.description = description;
    if (content !== undefined) post.content = content;
    if (image !== undefined) post.image = image;
    if (category !== undefined) post.category = category;

    // Core rule: If an approved post is edited, send it back for approval (pending)
    if (post.status === 'approved' && hasContentChanges) {
      post.status = status || 'pending';
    } else if (status) {
      post.status = status;
    }

    // If a rejected post is updated/resubmitted to pending, clear the previous rejection reason
    if (post.status === 'pending') {
      post.rejectionReason = null;
    }

    await post.save();
    await post.populate('createdBy', 'name email role');

    return sendSuccess(res, 'Post updated successfully.', post);
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return sendError(res, 'Post not found.', 404);
    }

    const isOwner = post.createdBy.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return sendError(res, 'Access denied. You can only delete your own posts.', 403);
    }

    await Post.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 'Post deleted successfully.', { id: req.params.id });
  } catch (error) {
    next(error);
  }
};
