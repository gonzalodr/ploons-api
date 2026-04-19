import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { AppError } from '@utils/appError.utils';
import { formatError } from '@utils/zodError.utils';

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = (err as AppError).statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message: any = err.message || 'Something went wrong';

  // 0. Zod Validation Error
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json(formatError(err));
  }

  // 1. Prisma unique constraint error
  if ((err as any).code === 'P2002') {
    statusCode = StatusCodes.CONFLICT;
    const target = (err as any).meta?.target || 'field';
    message = `The ${target} is already in use.`;
  }

  // 2. Prisma not found error
  if ((err as any).code === 'P2025') {
    statusCode = StatusCodes.NOT_FOUND;
    message = 'Record not found.';
  }

  // 3. Log error for debugging (only in development)
  if (process.env.ENVIRONMENT === 'development') {
    console.error('ERROR:', {
      name: err.name,
      message,
      stack: err.stack,
    });
  }

  // 4. Send response
  res.status(statusCode).json({
    status: 'error',
    message: statusCode === StatusCodes.INTERNAL_SERVER_ERROR && process.env.ENVIRONMENT === 'production'
      ? 'Internal server error. Please try again later.'
      : message,
    ...(process.env.ENVIRONMENT === 'development' && { stack: err.stack })
  });
};
