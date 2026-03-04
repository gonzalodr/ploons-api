import { z } from 'zod';
import { Difficulty } from '@enums/difculty.enum';

export const ingredientSchema = z.object({
  name: z.string().min(1, "El nombre del ingrediente es requerido"),
  amount: z.string().min(1, "La cantidad es requerida"),
  unit: z.string().optional().nullable(),
  order_index: z.number().int("El índice debe ser un número entero")
});

export const stepSchema = z.object({
  step_number: z.number().int("El número de paso debe ser entero"),
  instruction: z.string().min(10, "La instrucción debe tener al menos 10 caracteres"),
});

export const createRecipeSchema = z.object({
  title: z.string().min(3, "El título es demasiado corto (mínimo 3 caracteres)"),
  description: z.string().max(500, "La descripción no puede exceder los 500 caracteres").optional(),
  prep_time_mins: z.preprocess((val) => Number(val), z.number().min(0, "El tiempo no puede ser negativo")),
  difficulty: z.enum(Difficulty, { error:` Tipo de dificultad no valida. Solo puede ser: ${Object.values(Difficulty).join(', ')}`}),
  calories: z.preprocess((val) => val ? Number(val) : null, z.number().nullable().optional()),
  is_published: z.preprocess((val) => val === 'true', z.boolean().default(false)),
  ingredients: z.preprocess((val) => typeof val === 'string' ? JSON.parse(val) : val, z.array(ingredientSchema).min(1, "La receta debe tener al menos un ingrediente")),
  steps: z.preprocess((val) => typeof val === 'string' ? JSON.parse(val) : val, z.array(stepSchema).min(1, "La receta debe tener al menos un paso"))
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;