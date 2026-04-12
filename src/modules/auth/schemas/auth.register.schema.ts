import { date, z } from 'zod';
import { loginSchema } from '@module/auth/schemas/auth.login.schema';

export const registerSchema = loginSchema.extend({
    first_name: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(50, 'El nombre es demasiado largo')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, 'El nombre solo debe contener letras'),

    last_name: z
        .string()
        .min(2, 'El apellido debe tener al menos 2 caracteres')
        .max(50, 'El apellido es demasiado largo')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, 'El apellido solo debe contener letras'),
    confirmPassword: z.string()

}).refine((data) => data.confirmPassword === data.password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;