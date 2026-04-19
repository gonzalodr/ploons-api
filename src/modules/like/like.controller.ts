import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import z from 'zod';

import { LikeService } from "@module/like/like.service";
import { AppError } from '@utils/appError.utils';
import { catchAsync } from '@utils/catchAsync.utils';

export class LikeController {
    private likeService: LikeService;
    constructor() {
        this.likeService = new LikeService();
    }

    // 1. like or unlike
    likeOrUnlikeRecipe = catchAsync(async (req: Request, res: Response) => {
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
        const result = await this.likeService.likeOrUnlikeRecipe(userId, recipeId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result)
    });

    // 2. get likes 
    getRecipeLikes = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const recipeId = req.params.recipeId as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        // 2. validate (user optional)
        if (userId && !z.uuid().safeParse(userId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        if (!recipeId || !z.uuid().safeParse(recipeId).success) {
            throw new AppError('Invalid Recipe ID format', StatusCodes.BAD_REQUEST);
        }
        // 3. call service
        const result = await this.likeService.getRecipeLikes(recipeId, page, limit, userId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result)
    });

    // 3. check my like
    getLikeStatus = catchAsync(async (req: Request, res: Response) => {
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
        const result = await this.likeService.checkUserLike(userId, recipeId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result);
    });
}