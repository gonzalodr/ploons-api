import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

export const validateImage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next(); // Es opcional en un update

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(StatusCodes.BAD_REQUEST).json('Only JPG, PNG and WebP are allowed');
  }

  if (req.file.size > maxSize) {
    return res.status(StatusCodes.BAD_REQUEST).json('File is too large (Max 5MB)');
  }

  next();
};