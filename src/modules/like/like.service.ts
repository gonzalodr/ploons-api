import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { StatusCodes } from "http-status-codes";


export class LikeService {
    // 1. like/dislike recipe
    async likeOrUnlikeRecipe(userId: string, recipeId: string) {
        // 1. validate recipe exist
        const recipe = await prisma.recipes.findUnique({ where: { id: recipeId } });

        if (!recipe || (recipe.user_id !== userId && !recipe.is_published)) {
            throw new AppError('Recipe not found', StatusCodes.NOT_FOUND);
        }
        // 2. save like or eliminate like (like/dislike)
        const existingLike = await prisma.likes.findUnique({ where: { user_id_recipe_id: { user_id: userId, recipe_id: recipeId } } });
        let status: 'liked' | 'unliked';
        if (existingLike) {
            // unlike
            await prisma.likes.delete({
                where: { user_id_recipe_id: { user_id: userId, recipe_id: recipeId } }
            });
            status = 'unliked';
        } else {
            // like
            await prisma.likes.create({
                data: { user_id: userId, recipe_id: recipeId }
            });
            status = 'liked';
        }
        // send status and count
        const count = await prisma.likes.count({ where: { recipe_id: recipeId } });
        return { status, total_likes: count };
    }
    // 2. get list like
    async getRecipeLikes(recipeId: string, page: number = 1, limit: number = 30, userId?: string) {
        // 1. get skip
        const skip = (page - 1) * limit;

        // 2. get list likes
        const [likes, total] = await prisma.$transaction([
            prisma.likes.findMany({
                where: { recipe_id: recipeId },
                take: limit,
                skip: skip,
                include: {
                    profiles: {
                        select: {
                            id: true,
                            username: true,
                            first_name: true,
                            last_name: true,
                            avatar_url: true,
                            ...(userId && {
                                followers: { where: { follower_id: userId } },
                                following: { where: { following_id: userId } }
                            })
                        }
                    }
                },
                orderBy: {
                    created_at: 'asc'
                }
            }),
            prisma.likes.count({ where: { recipe_id: recipeId } })
        ]);

        const data = likes.map(l => {
            const profile = l.profiles as any;
            // i follow
            const iAmFollowing = userId ? profile.following?.length > 0 : false;
            // follow me
            const isFollowingMe = userId ? profile.followers?.length > 0 : false;

            return {
                id: profile.id,
                username: profile.username,
                first_name: profile.first_name,
                last_name: profile.last_name,
                avatar_url: profile.avatar_url,
                relationship: {
                    i_am_following: iAmFollowing,
                    is_following_me: isFollowingMe,
                    is_mutual: iAmFollowing && isFollowingMe,
                    is_me: profile.id === userId
                }
            };
        });

        return {
            users: data,
            pagination: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit),
                hasMore: skip + likes.length < total
            }
        };
    }
    // 3. check my like
    async checkUserLike(userId: string, recipeId: string) {
        // 1. get my like
        const like = await prisma.likes.findUnique({
            where: {
                user_id_recipe_id: {
                    user_id: userId,
                    recipe_id: recipeId
                }
            },
            select: { user_id: true }
        });

        return { isLiked: !!like };
    }
}