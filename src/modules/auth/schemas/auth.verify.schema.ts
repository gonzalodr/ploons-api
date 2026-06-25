import { z } from 'zod';

export const verifyOtpSchema = z.object({
  email: z.email('Invalid email').transform(val => val.toLowerCase().trim()),
  token: z.string().min(1, 'Token is required')
});