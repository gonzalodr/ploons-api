import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

// config storage
const storage = multer.memoryStorage();

// config base multer
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

// middleware unique file
export const uploadSingle = multerUpload.single('image');

// middleware multiple file
export const uploadMultiple = multerUpload.array('images', 5);

// manual calidations
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