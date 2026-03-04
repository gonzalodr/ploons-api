import z from "zod";
import { createRecipeSchema, ingredientSchema, stepSchema } from "src/modules/recipe/schemas/recipe.create.schema";

export const updateRecipeSchema = createRecipeSchema.partial().extend({
    // id to update ingredients
    delete_image: z.boolean().default(false),
    ingredients: z.preprocess((val) => typeof val === 'string' ? JSON.parse(val) : val,
        z.array(ingredientSchema.extend({
            id: z.uuid().optional() // update if exist id
        }))).optional(),
    // id to update ingredients
    steps: z.preprocess((val) => typeof val === 'string' ? JSON.parse(val) : val,
        z.array(stepSchema.extend({
            id: z.uuid().optional() // update if exist id
        }))).optional()
});
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;