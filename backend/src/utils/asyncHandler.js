// src/utils/asyncHandler.js
// Wraps an async Express route handler so any thrown error or rejected
// Promise is automatically passed to next(), which routes it to your
// global error middleware — without needing try/catch in every controller.

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};