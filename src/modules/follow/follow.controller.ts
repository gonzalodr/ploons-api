import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { AppError } from '@utils/appError.utils';
import { FollowService } from "@module/follow/follow.service";
import { catchAsync } from '@utils/catchAsync.utils';

export class FollowController {
    private followService: FollowService;

    constructor() {
        this.followService = new FollowService();
    }

    // 1. Toggle Follow (follow/unfollow)
    toggleFollow = catchAsync(async (req: Request, res: Response) => {
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
    });

    // 2. get my follows
    getMyFollowers = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        // 2. validate
        if (!userId || !z.uuid().safeParse(userId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        // 3. call service
        const result = await this.followService.getFollowers(userId, page, limit, userId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result);
    });

    // 3. get i'm following
    getWhoIFollow = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        // 2. validate
        if (!userId || !z.uuid().safeParse(userId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        // 3. call service
        const result = await this.followService.getFollowing(userId, page, limit, userId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result);
    });

    // 4. get x <- follows
    getFollowers = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const targetUserId = req.params.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        // 2. validate
        if (!targetUserId || !z.uuid().safeParse(targetUserId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        // 3. call service
        const result = await this.followService.getFollowers(targetUserId, page, limit, userId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result);
    });

    // 5. get x -> following
    getFollowing = catchAsync(async (req: Request, res: Response) => {
        // 1. get data
        const userId = req.user?.id;
        const targetUserId = req.params.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        // 2. validate
        if (!targetUserId || !z.uuid().safeParse(targetUserId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        // 3. call service
        const result = await this.followService.getFollowing(targetUserId, page, limit, userId);
        // 4. send result
        return res.status(StatusCodes.OK).json(result);
    });
}