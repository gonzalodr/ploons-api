import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { StatusCodes } from "http-status-codes";
import { formatPagination } from "@utils/pagination.utils";

export class FollowService {

    // 1. follow other user (follow/unfollow)
    async toggleFollow(userId: string, followingId: string) {
        // 1. validate no follow myself
        if (userId === followingId) {
            throw new AppError("You cannot follow yourself", StatusCodes.BAD_REQUEST);
        }
        // 2. validate follow exist
        const existingFollow = await prisma.follows.findUnique({
            where: {
                follower_id_following_id: {
                    follower_id: userId,
                    following_id: followingId
                }
            }
        });
        // 3. if exist follow -> unfollow
        if (existingFollow) {
            // delete follow
            await prisma.follows.delete({
                where: {
                    follower_id_following_id: {
                        follower_id: userId,
                        following_id: followingId
                    }
                }
            });
            return { status: "unfollowed" };
        }

        // 4. follow profile
        await prisma.follows.create({
            data: {
                follower_id: userId,
                following_id: followingId
            }
        });
        return { status: "followed" };
    }

    // 2. X user <- followers (Those who follow targetUserId)
    async getFollowers(targetUserId: string, page: number = 1, limit: number = 20, currentUserId?: string) {
        const skip = (page - 1) * limit;

        const [followers, total] = await prisma.$transaction([
            prisma.follows.findMany({
                where: { following_id: targetUserId },
                take: limit,
                skip: skip,
                include: {
                    profiles_follows_follower_idToprofiles: {
                        select: {
                            id: true,
                            username: true,
                            first_name: true,
                            last_name: true,
                            avatar_url: true,
                            ...(currentUserId && {
                                // ¿El usuario de la lista sigue a currentUserId?
                                follows_follows_follower_idToprofiles: { where: { following_id: currentUserId } },
                                // ¿currentUserId sigue al usuario de la lista?
                                follows_follows_following_idToprofiles: { where: { follower_id: currentUserId } }
                            })
                        }
                    }
                }
            }),
            prisma.follows.count({ where: { following_id: targetUserId } })
        ]);

        const data = followers.map(f => {
            const profile = f.profiles_follows_follower_idToprofiles as any;
            const iFollowThem = currentUserId ? profile.follows_follows_following_idToprofiles?.length > 0 : false;
            const theyFollowMe = currentUserId ? profile.follows_follows_follower_idToprofiles?.length > 0 : false;

            return {
                id: profile.id,
                username: profile.username,
                first_name: profile.first_name,
                last_name: profile.last_name,
                avatar_url: profile.avatar_url,
                relationship: {
                    i_am_following: iFollowThem,
                    is_following_me: theyFollowMe,
                    is_mutual: iFollowThem && theyFollowMe,
                    is_me: profile.id === currentUserId
                }
            };
        });

        return formatPagination(data, page, limit, total);
    }

    // 3. X user -> following (Who does targetUserId follow?)
    async getFollowing(targetUserId: string, page: number = 1, limit: number = 20, currentUserId?: string) {
        const skip = (page - 1) * limit;

        const [following, total] = await prisma.$transaction([
            prisma.follows.findMany({
                where: { follower_id: targetUserId },
                take: limit,
                skip: skip,
                include: {
                    profiles_follows_following_idToprofiles: {
                        select: {
                            id: true,
                            username: true,
                            first_name: true,
                            last_name: true,
                            avatar_url: true,
                            ...(currentUserId && {
                                // ¿El usuario de la lista sigue a currentUserId?
                                follows_follows_follower_idToprofiles: { where: { following_id: currentUserId } },
                                // ¿currentUserId sigue al usuario de la lista?
                                follows_follows_following_idToprofiles: { where: { follower_id: currentUserId } }
                            })
                        }
                    }
                }
            }),
            prisma.follows.count({ where: { follower_id: targetUserId } })
        ]);

        const data = following.map(f => {
            const profile = f.profiles_follows_following_idToprofiles as any;
            const iFollowThem = currentUserId ? profile.follows_follows_following_idToprofiles?.length > 0 : false;
            const theyFollowMe = currentUserId ? profile.follows_follows_follower_idToprofiles?.length > 0 : false;

            return {
                id: profile.id,
                username: profile.username,
                first_name: profile.first_name,
                last_name: profile.last_name,
                avatar_url: profile.avatar_url,
                relationship: {
                    i_am_following: iFollowThem,
                    is_following_me: theyFollowMe,
                    is_mutual: iFollowThem && theyFollowMe,
                    is_me: profile.id === currentUserId
                }
            };
        });

        return formatPagination(data, page, limit, total);
    }
}