import { Post } from '../models/Post.js';
import { improvePostContent } from '../utils/geminiService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const improvePost = async (req, res, next) => {
  try {
    const { postId } = req.params;

    // 1. Retrieve the original post from MongoDB
    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return sendError(res, 'Post not found.', 404);
    }

    // 2. Enforce ownership: only the author can request AI improvement for their post
    if (!originalPost.createdBy.equals(req.user._id)) {
      return sendError(res, 'Access denied. You can only request AI improvements for your own posts.', 403);
    }

    // 3. Call Gemini AI service to enhance grammar, clarity, readability, and structure
    let improvedData;
    try {
      improvedData = await improvePostContent({
        title: originalPost.title,
        description: originalPost.description,
        content: originalPost.content,
        category: originalPost.category,
      });
    } catch (aiError) {
      if (aiError.code === 'MISSING_API_KEY') {
        return sendError(
          res,
          'Gemini AI content improvement is currently unavailable because GEMINI_API_KEY is not configured in the environment.',
          503
        );
      }
      return sendError(
        res,
        aiError.message || 'AI service temporarily unavailable. Please try again later.',
        aiError.status || 502
      );
    }

    // 4. Save improved content as a NEW post document with a NEW MongoDB ID
    // CRITICAL: The original post is preserved completely unchanged
    const newDraftPost = new Post({
      title: improvedData.title || originalPost.title,
      description: improvedData.description || originalPost.description,
      content: improvedData.content || originalPost.content,
      image: originalPost.image,
      category: originalPost.category,
      createdBy: req.user._id,
      status: 'draft', // Always saved as draft; never automatically approved or published
      originalPostId: originalPost._id,
      isAiImproved: true,
    });

    await newDraftPost.save();
    await newDraftPost.populate('createdBy', 'name email role');

    return sendSuccess(
      res,
      'Content improved successfully by AI and saved as a new draft.',
      {
        originalPost: {
          id: originalPost._id,
          title: originalPost.title,
          status: originalPost.status,
        },
        improvedPost: newDraftPost,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};
