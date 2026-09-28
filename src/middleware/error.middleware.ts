import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid resource ID format'
    });
    return;
  }

  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: message
    });
    return;
  }

  if (error.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON payload'
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message
  });
};
