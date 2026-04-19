import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

import { ProfileService } from "@module/profile/profile.service";
import { AppError } from '@utils/appError.utils';
import { updateProfileSchema } from '@module/profile/schemas/profile.update.schema';
import { catchAsync } from '@utils/catchAsync.utils';

export class ProfileController {
    private profileService: ProfileService;
    constructor() {
        this.profileService = new ProfileService();
    }

    // 1. get my profile
    getMyProfile = catchAsync(async (req: Request, res: Response) => {
        //1. get user/profile
        const userId = req.user?.id;
        //2. validate uuid
        if (!userId || !z.uuid().safeParse(userId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        //3. call profile services
        const result = await this.profileService.getMyProfile(userId);
        //5. return result
        return res.status(StatusCodes.OK).json(result);
    });

    //2. update my profile
    updateProfile = catchAsync(async (req: Request, res: Response) => {
        //1. get data
        const userId = req.user?.id;
        const file = req.file;
        const bodyData = { ...req.body };
        //2. validate uuid
        if (!userId || !z.uuid().safeParse(userId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }

        // 3. clear and validate empty social media
        if (typeof bodyData.social_media === 'string' && bodyData.social_media.length > 0) {
            bodyData.social_media = JSON.parse(bodyData.social_media);
        }
        if (bodyData.social_media) {
            Object.keys(bodyData.social_media).forEach(key => {
                const value = bodyData.social_media[key];
                // clear social
                if (value === "" || value === null || value === undefined) {
                    delete bodyData.social_media[key];
                }
            });

            // if social media is empty is deleted
            if (Object.keys(bodyData.social_media).length === 0) {
                delete bodyData.social_media;
            }
        }
        //4. parse and validate data
        const validatedData = updateProfileSchema.parse(bodyData);
        //5. call profile services
        const result = await this.profileService.updateMyProfil(userId, validatedData, file);
        //6. send result
        return res.status(StatusCodes.OK).json(result);
    });

    //3. get profile
    getProfileById = catchAsync(async (req: Request, res: Response) => {
        //1. get params id
        const userId = req.user?.id;
        const profileId = req.params.profileId as string;
        //2. validate uuid
        if (userId && !z.uuid().safeParse(userId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        if (!profileId || !z.uuid().safeParse(profileId).success) {
            throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
        }
        //4. call service
        const result = await this.profileService.getProfileById(profileId, userId);
        return res.status(StatusCodes.OK).json(result);
    });
}