import { z } from 'zod';
import { Difficulty } from '@enums/difculty.enum';

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  amount: z.string().min(1, "Amount is required"),
  unit: z.string().optional().nullable(),
  order_index: z.number().int("Index must be an integer")
});

export const stepSchema = z.object({
  step_number: z.number().int("Step number must be an integer"),
  instruction: z.string().min(10, "Instruction must be at least 10 characters"),
});

export const createRecipeSchema = z.object({
  title: z.string().min(3, "Title is too short (minimum 3 characters)"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  prep_time_mins: z.preprocess((val) => Number(val), z.number().min(0, "Time cannot be negative")),
  difficulty: z.enum(Difficulty, { error:` Invalid difficulty type. Allowed: ${Object.values(Difficulty).join(', ')}`}),
  calories: z.preprocess((val) => val ? Number(val) : null, z.number().nullable().optional()),
  is_published: z.preprocess((val) => val === 'true', z.boolean().default(false)),
  ingredients: z.preprocess((val) => typeof val === 'string' ? JSON.parse(val) : val, z.array(ingredientSchema).min(1, "Recipe must have at least one ingredient")),
  steps: z.preprocess((val) => typeof val === 'string' ? JSON.parse(val) : val, z.array(stepSchema).min(1, "Recipe must have at least one step"))
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;