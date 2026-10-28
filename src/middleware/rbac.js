import { sendError } from '../utils/response.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Requires one of the following roles: [${roles.join(', ')}]. Current role: '${req.user.role}'`,
        403
      );
    }

    next();
  };
};

export const requireAdmin = authorize('admin');
