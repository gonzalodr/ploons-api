import { Request, Response } from "express";
import { z } from "zod";
import { StatusCodes } from "http-status-codes";
import { ShareService } from "@module/share/share.service";
import { AppError } from "@utils/appError.utils";
import { catchAsync } from "@utils/catchAsync.utils";

export class ShareController {
    private shareService: ShareService;

    constructor() {
        this.shareService = new ShareService();
    }

    // 1. register share
    registerShare = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const { recipeId, comment } = req.body;

        // 2. validate
        if (!userId || !z.uuid().safeParse(userId).success) {
            throw new AppError("Invalid User ID format", StatusCodes.BAD_REQUEST);
        }
        if (!recipeId || !z.uuid().safeParse(recipeId).success) {
            throw new AppError("Invalid Recipe ID format", StatusCodes.BAD_REQUEST);
        }

        // 3. call service
        const result = await this.shareService.registerShare(userId, recipeId, comment);

        // 4. send response
        return res.status(StatusCodes.CREATED).json(result);
    });

    // 2. get my shared recipes
    getMySharedRecipes = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

        // 2. validate
        if (!userId || !z.uuid().safeParse(userId).success) {
            throw new AppError("Invalid User ID format", StatusCodes.BAD_REQUEST);
        }

        // 3. call service
        const result = await this.shareService.getMySharedRecipes(userId, page, limit);

        // 4. send response
        return res.status(StatusCodes.OK).json(result);
    });
}
