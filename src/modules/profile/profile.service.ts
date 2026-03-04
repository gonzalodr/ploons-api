import { StatusCodes } from 'http-status-codes';
import { prisma } from '@config/db.config'
import { AppError } from '@utils/appError.utils';
import { CloudinaryService } from '@utils/cloudinary.utils';
import { UpdateProfileInput } from 'src/modules/profile/schemas/profile.update.schema';
import { count } from 'node:console';

export class ProfileService {
    // 1. get my profile
    async getMyProfile(userId: string) {
        const profile = await prisma.profiles.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        // follow me
                        follows_follows_following_idToprofiles: true,
                        // i follow
                        follows_follows_follower_idToprofiles: true,
                        // count recipes post
                        recipes: true
                    }
                }
            }

        });
        if (!profile) {
            throw new AppError('Profile not found', StatusCodes.NOT_FOUND);
        }
        const { _count, ...profileData } = profile;
        return {
            ...profileData,
            // follow me
            count_followers: _count.follows_follows_following_idToprofiles,
            // follow me
            count_following: _count.follows_follows_follower_idToprofiles,
            // count post
            count_post: _count.recipes,
        };
    }

    // 2. update my profile
    async updateMyProfil(userId: string, data: UpdateProfileInput, file?: Express.Multer.File) {
        //1. validate profile
        const validateProfile = await this.getMyProfile(userId);
        let avatar_url = validateProfile.avatar_url;
        //2. update or delete avatar profile
        if (data.delete_avatar) {
            // delete in cloudinary
            if (avatar_url) {
                await CloudinaryService.deleteImage(`ploons/avatars/user_${userId}`);
            }
            avatar_url = null;
        }
        else if (file) {
            // save in cloudinary
            const updateImage = await CloudinaryService.uploadBuffer(file.buffer, 'avatars', `user_${userId}`);
            avatar_url = updateImage.url;
        }
        // 3. update profile in db
        const { delete_avatar, social_media, ...updateData } = data;
        return await prisma.profiles.update({
            where: { id: userId },
            data: {
                ...updateData,
                social_media: social_media ?? undefined,
                avatar_url: avatar_url
            }
        });
    }
    // 3. get profile by id (use when i view a other profile thats no mine)
    async getProfileById(profileId: string, userId?: string) {
        const profile = await prisma.profiles.findUnique({
            where: { id: profileId },
            //show only information secure
            select: {
                id: true,
                username: true,
                first_name: true,
                last_name: true,
                avatar_url: true,
                bio: true,
                social_media: true,
                created_at: true,
                ...(userId && {
                    followers: { where: { follower_id: userId } },
                    following: { where: { following_id: userId } }
                }),
                _count: {
                    select: {
                        // follow me
                        follows_follows_following_idToprofiles: true,
                        // i follow
                        follows_follows_follower_idToprofiles: true,
                        // count recipes post
                        recipes: true
                    }
                }
            }
        });
        if (!profile) {
            throw new AppError('User profile not found', StatusCodes.NOT_FOUND);
        }
        // Logic to determine relationship status
        const iAmFollowing = userId ? (profile as any).following?.length > 0 : false;
        const isFollowingMe = userId ? (profile as any).followers?.length > 0 : false;

        return {
            id: profile.id,
            username: profile.username,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            social_media: profile.social_media ?? undefined,
            created_at: profile.created_at,
            // follow me
            count_followers: profile._count.follows_follows_following_idToprofiles,
            // follow me
            count_following: profile._count.follows_follows_follower_idToprofiles,
            // count post
            count_post: profile._count.recipes,

            relationship: {
                i_am_following: iAmFollowing,
                is_following_me: isFollowingMe,
                is_mutual: iAmFollowing && isFollowingMe,
                is_me: profile.id === userId
            }
        };
    }
}