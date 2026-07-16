// src/middlewares/errorMiddleware.js
// Centralized error handler. Every error passed to next(error) — whether
// from asyncHandler catching a rejected Promise, or called directly —
// ends up here instead of leaking a raw stack trace to the client.
// Must be registered LAST in app.js, after all routes.

export const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  // MySQL duplicate entry (e.g. UNIQUE constraint violation)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  // MySQL foreign key constraint violation (e.g. deleting a role still in use)
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      success: false,
      message: 'Cannot complete this action: related records still reference this item.',
    });
  }

  // Fallback: use the error's own status if it has one, otherwise 500
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
    // Stack trace only in development — never leak internals in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// 404 handler — for requests that don't match any route at all.
// Registered right before errorMiddleware, after all real routes.
export const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};