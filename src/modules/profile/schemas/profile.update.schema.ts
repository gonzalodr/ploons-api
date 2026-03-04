import { z } from 'zod';

const socialRegex = (domain: string) => new RegExp(`^(https?:\\/\\/)?(www\\.)?${domain}\\.[a-z]+\\/[a-zA-Z0-9(_.)]+\\/?$`);

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional(),
  social_media: z.object({
    instagram: z
      .string()
      .regex(socialRegex('instagram'), "Enlace de Instagram no válido")
      .or(z.literal(""))
      .optional(),
    
    twitter: z
      .string()
      .regex(/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9(_)]+\/?$/, "Enlace de Twitter/X no válido")
      .or(z.literal(""))
      .optional(),
    
    facebook: z
      .string()
      .regex(socialRegex('facebook'), "Enlace de Facebook no válido")
      .or(z.literal(""))
      .optional(),
    
    website: z
      .url("Debe ser una URL válida (ej: https://tusitio.com)")
      .or(z.literal(""))
      .optional(),
  }).optional()
  .transform((val) => {
    if (!val) return val;
    // clear social media is empty
    return Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
    );
  }),
  delete_avatar: z.preprocess((val) => val === 'true', z.boolean()).optional().default(false)
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;