// Wraps an async route handler and forwards any thrown error as a 500 response,
// eliminating the try/catch boilerplate from every inline route handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(err => res.status(500).json({ message: err.message }));

module.exports = asyncHandler;
