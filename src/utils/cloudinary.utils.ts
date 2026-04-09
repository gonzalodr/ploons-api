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
          resource_type: 'image',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            return reject(new AppError('Error uploading image to Cloudinary', StatusCodes.INTERNAL_SERVER_ERROR));
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok') {
        console.warn(`Cloudinary delete warning: ${result.result}`);
      }
    } catch (error) {
      throw new AppError('Error deleting image from Cloudinary', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}