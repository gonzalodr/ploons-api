import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max.
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and WebP are allowed') as any, false);
    }
  }
});

/**
* Creates an upload middleware for a specific field
* @param fieldName - Name of the field in the form (e.g., 'image', 'avatar')
* @returns Middleware for multiple configured fields
*/
export const uploadSingle = (fieldName: string) => multerUpload.single(fieldName);

/**
* Creates a multi-upload middleware for a specific field
* @param fieldName - Name of the field in the form
* @param maxCount - Maximum number of files
* @returns Configured multi-upload middleware
*/
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
  multerUpload.array(fieldName, maxCount);

// validate formatt
export const validateImage = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Only JPG, PNG and WebP are allowed' });
  }

  if (req.file.size > maxSize) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'File is too large (Max 5MB)' });
  }
  next();
};