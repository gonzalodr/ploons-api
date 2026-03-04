import { email, z } from 'zod';

export const loginSchema = z.object({
  email: z
    .email('Email no válido'),
    
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe tener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número')
});

export type LoginInput = z.infer<typeof loginSchema>;