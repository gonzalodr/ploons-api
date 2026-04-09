import { z } from 'zod';

export const verifyOtpSchema = z.object({
  email: z.email('Email no válido'),
  token: z.string().min(1, 'Token requerido')
});