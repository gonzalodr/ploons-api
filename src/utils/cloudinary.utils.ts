import { UploadApiResponse } from 'cloudinary';
import cloudinary from '@config/cloudinary.config';
import { AppError } from '@utils/appError.utils';
import { StatusCodes } from 'http-status-codes';

interface UploadResult {
  url: string;
  publicId: string;
}

export class CloudinaryService {
  static async uploadBuffer(fileBuffer: Buffer, folder: string, publicId?: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `ploons/${folder}`,
          public_id: publicId,
          overwrite: true,
          resource_type: 'auto',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(new AppError(
              error?.message || 'Error uploading file to Cloudinary',
              StatusCodes.INTERNAL_SERVER_ERROR
            ));
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  static async deleteImage(publicId: string): Promise<void> {
    if (!publicId || publicId.trim() === '') {
      return;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok' && result.result !== 'not found') {
        console.warn(`Cloudinary delete warning: ${result.result} for ${publicId}`);
      }
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new AppError(
        error instanceof Error ? error.message : 'Error deleting file from Cloudinary',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}