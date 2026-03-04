import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { FeedService } from "src/modules/feed/feed.service";
import { AppError } from "@utils/appError.utils";
import { z } from 'zod';

export class FeedController {
    private feedService: FeedService;

    constructor() {
        this.feedService = new FeedService();
    }

    async getFollowingFeed(req: Request, res: Response) {
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
            const result = await this.feedService.getFollowingFeed(userId, page, limit);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    async getTrending(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            // 2. call service
            const result = await this.feedService.getTrendingFeed(page, limit,userId);
            // 3. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "No pudimos cargar las tendencias en este momento",
                error: error.message
            });
        }
    }
}