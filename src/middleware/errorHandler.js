import { sendError } from '../utils/response.js';
import { config } from '../config/env.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  // Safe logging that masks any secrets
  if (config.nodeEnv !== 'test') {
    console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);
  }

  // Handle body-parser JSON syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Malformed JSON in request body.', 400);
  }

  // Mongoose invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    return sendError(
      res,
      `Invalid format for '${err.path}': value '${err.value}' is not a valid ObjectId`,
      400
    );
  }

  // Mongoose Schema Validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return sendError(res, 'Database validation error', 400, messages);
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(
      res,
      `A record with this ${field} already exists. Duplicate values are not allowed.`,
      409
    );
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired. Please log in again.', 401);
  }

  // Generic internal server error
  const statusCode = err.statusCode || err.status || 500;
  const message =
    config.nodeEnv === 'production' && statusCode === 500
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal server error';

  return sendError(res, message, statusCode);
};
