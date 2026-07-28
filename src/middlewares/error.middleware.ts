import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { AppError } from '@utils/appError.utils';
import { formatError } from '@utils/zodError.utils';
import { handlePrismaError } from '@utils/prismaError.utils';
import { logger } from '@utils/logger.utils';

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isProduction = process.env.ENVIRONMENT === 'production';

  // 0. Zod Validation Error (safe to expose)
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json(formatError(err));
  }

  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';

  // 1. Known Prisma error → controlled message
  const prismaError = handlePrismaError(err as { code?: string; meta?: Record<string, unknown> });
  if (prismaError) {
    statusCode = prismaError.statusCode;
    message = prismaError.message;
  }

  // 2. Operational AppError thrown intentionally by a service
  else if ((err as AppError).isOperational) {
    statusCode = (err as AppError).statusCode;
    message = err.message;
  }

  // 3. Native / unexpected error → sanitize in production
  else {
    statusCode = (err as AppError).statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    message = isProduction
      ? 'Internal server error. Please try again later.'
      : err.message;
  }

  // 4. Log every error with full context
  logger.error(err.name || 'Error', {
    message: err.message,
    stack: err.stack,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: (req as any).user?.id,
  });

  // 5. Send sanitized response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(isProduction ? {} : { stack: err.stack })
  });
};
