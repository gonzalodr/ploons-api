import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '@utils/appError.utils';
import { formatError } from '@utils/zodError.utils';
import { RecipeService } from "@module/recipe/recipe.service";
import { createRecipeSchema } from '@module/recipe/schemas/recipe.create.schema';
import { updateRecipeSchema } from '@module/recipe/schemas/recipe.update.schema';

export class RecipeController {
    private recipeService: RecipeService;
    constructor() {
        this.recipeService = new RecipeService();
    }
    // 1. create recipe
    async createRecipe(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const file = req.file;
            const bodyData = { ...req.body }
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. parse
            const validatedData = createRecipeSchema.parse(bodyData);
            // 4. call services
            const result = await this.recipeService.createRecipe(userId, validatedData, file);
            // 5. send result
            return res.status(StatusCodes.CREATED).json(result);
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(StatusCodes.BAD_REQUEST).json(formatError(error));
            }
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 2. update recipe
    async updateRecipe(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const recipeId = req.params.recipeId as string;
            const file = req.file;
            const bodyData = { ...req.body }
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (!recipeId || !z.uuid().safeParse(recipeId).success) {
                throw new AppError('Invalid Recipe ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. parser
            const validatedData = updateRecipeSchema.parse(bodyData);
            // 4. call services
            const result = await this.recipeService.updateRecipe(userId, recipeId, validatedData, file);
            // 5. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(StatusCodes.BAD_REQUEST).json(formatError(error));
            }
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 3. delete recipe
    async deleteRecipe(req: Request, res: Response) {
        try {
            //1. get data
            const userId = req.user?.id;
            const recipeId = req.params.recipeId as string;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (!recipeId || !z.uuid().safeParse(recipeId).success) {
                throw new AppError('Invalid Recipe ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call services
            const result = await this.recipeService.deleteRecipe(userId, recipeId);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(StatusCodes.BAD_REQUEST).json(formatError(error));
            }
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 4. get public recipe (public)
    async getRecipeById(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const recipeId = req.params.recipeId as string;
            // 2. validate
            if(userId && !z.uuid().safeParse(userId).success){
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (!recipeId || !z.uuid().safeParse(recipeId).success) {
                throw new AppError('Invalid Recipe ID format', StatusCodes.BAD_REQUEST);
            }
            // 4. call services
            const result = await this.recipeService.getRecipeById(recipeId, userId);
            // 5. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(StatusCodes.BAD_REQUEST).json(formatError(error));
            }
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 5. get private recipe
    async getPrivateRecipeById(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const recipeId = req.params.recipeId as string;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (!recipeId || !z.uuid().safeParse(recipeId).success) {
                throw new AppError('Invalid Recipe ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call services
            const result = await this.recipeService.getPrivateRecipeById(userId, recipeId);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(StatusCodes.BAD_REQUEST).json(formatError(error));
            }
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 6. get list of my list
    async getMyListRecipe(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call services
            const result = await this.recipeService.getMyListRecipes(userId, page, limit);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof ZodError) {
                return res.status(StatusCodes.BAD_REQUEST).json(formatError(error));
            }
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
};