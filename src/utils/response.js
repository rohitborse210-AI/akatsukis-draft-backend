export const sendSuccess = (res, message, data = null, statusCode = 200, extra = {}) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...extra
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (res, message, statusCode = 400, errors = null) => {
  const payload = {
    success: false,
    message,
    ...(errors && { errors })
  };
  return res.status(statusCode).json(payload);
};
