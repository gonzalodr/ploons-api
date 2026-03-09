import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { AppError } from '@utils/appError.utils';
import { FollowService } from "@module/follow/follow.service";

export class FollowController {
    private followService: FollowService;

    constructor() {
        this.followService = new FollowService();
    }
    // 1. Toggle Follow (follow/unfollow)
    async toggleFollow(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const followingId = req.params.followingId as string;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (!followingId || !z.uuid().safeParse(followingId).success) {
                throw new AppError('Invalid Following ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.followService.toggleFollow(userId, followingId);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 2. get my follows
    async getMyFollowers(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.followService.getFollowers(userId, page, limit);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 3. get i'm following
    async getWhoIFollow(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.followService.getFollowing(userId, page, limit);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 4. get x <- follows
    async getFollowers(req: Request, res: Response) {
        try {
            // 1. get data
            const targetUserId = req.user?.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            // 2. validate
            if (!targetUserId || !z.uuid().safeParse(targetUserId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.followService.getFollowers(targetUserId, page, limit);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 5. get x -> following
    async getFollowing(req: Request, res: Response) {
        try {
            // 1. get data
            const targetUserId = req.user?.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            // 2. validate
            if (!targetUserId || !z.uuid().safeParse(targetUserId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.followService.getFollowing(targetUserId, page, limit);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
}