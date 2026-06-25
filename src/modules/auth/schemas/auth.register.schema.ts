import { z } from 'zod';
import { loginSchema } from '@module/auth/schemas/auth.login.schema';

export const registerSchema = loginSchema.extend({
    first_name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name is too long')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, 'Name must only contain letters'),

    last_name: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name is too long')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, 'Last name must only contain letters'),
    confirmPassword: z.string()

}).refine((data) => data.confirmPassword === data.password, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;