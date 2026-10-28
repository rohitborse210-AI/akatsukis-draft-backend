import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { sendError } from '../utils/response.js';

const isTest = config.nodeEnv === 'test';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many requests from this IP, please try again after 15 minutes.', 429);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'Too many authentication attempts, please try again after 15 minutes.', 429);
  },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, 'AI rate limit reached. Please wait before generating more draft improvements.', 429);
  },
});
