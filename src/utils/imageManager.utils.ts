import { StatusCodes } from "http-status-codes";
import { CloudinaryService } from "./cloudinary.utils";
import { AppError } from "./appError.utils";

export class ImageManagerService {
  /**
   * Sube una imagen y elimina la anterior si existe
   * @param file Buffer del archivo
   * @param folder Carpeta en Cloudinary
   * @param publicId ID público de la imagen
   * @param oldImageUrl URL de la imagen anterior (opcional)
   * @returns URL de la nueva imagen
   */
  static async uploadAndReplace(
    file: Buffer,
    folder: string,
    publicId: string,
    oldImageUrl?: string | null
  ): Promise<string> {
    try {
      if (oldImageUrl) {
        const oldPublicId = this.extractPublicIdFromUrl(oldImageUrl);
        if (oldPublicId) {
          CloudinaryService.deleteImage(oldPublicId).catch(err => {
            console.error(`Failed to delete old image ${oldPublicId}:`, err);
          });
        }
      }
      const result = await CloudinaryService.uploadBuffer(file, folder, publicId);
      return result.url;
    } catch (error: any) {
      console.error("Image upload failed:", error);
      throw new AppError(
        error.message || "Failed to upload image. Please try again.",
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async deleteImage(imageUrl: string | null | undefined): Promise<void> {
    if (!imageUrl) return;

    try {
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (publicId) {
        await CloudinaryService.deleteImage(publicId);
      }
    } catch (error) {
      console.error(`Failed to delete image ${imageUrl}:`, error);
    }
  }
  private static extractPublicIdFromUrl(url: string): string | null {
    const matches = url.match(/\/upload\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
  }
}