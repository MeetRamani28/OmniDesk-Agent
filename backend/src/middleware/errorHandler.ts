import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Global Express Error Boundary
 * Catches all unhandled exceptions occurring within the REST API routes, 
 * sanitizes the payload for the client, and records the stack trace via Winston.
 */
export const globalErrorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const statusCode = err.status || err.statusCode || 500;
  
  // Log the raw, unsanitized fault for internal telemetry
  logger.error(`[Express] HTTP ${statusCode} | ${req.method} ${req.url} | ${err.message}`, { stack: err.stack });

  // Expose only sanitized errors to the client to prevent stack-trace leakages
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && isProduction ? 'Internal Server Error' : err.message,
      ...(isProduction ? {} : { stack: err.stack })
    }
  });
};
