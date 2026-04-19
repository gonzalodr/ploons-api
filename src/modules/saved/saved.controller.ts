import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@utils/appError.utils';
import { SavedService } from "@module/saved/saved.service";
import { catchAsync } from '@utils/catchAsync.utils';

export class SavedController {
    private savedService: SavedService;

    constructor() {
        this.savedService = new SavedService();
    }

    // 1. Toggle Save (saved/unsaved)
    toggleSave = catchAsync(async (req: Request, res: Response) => {
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
        // 3. call service
        const result = await this.savedService.toggleSave(userId, recipeId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result);
    });

    //  2. get saved
    getMySavedRecipes = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        // 2. validate
        if (!userId || !z.uuid().safeParse(userId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        // 3. call services
        const result = await this.savedService.getMySavedRecipes(userId, page, limit);
        // 4. send result
        return res.status(StatusCodes.OK).json(result);
    });
}