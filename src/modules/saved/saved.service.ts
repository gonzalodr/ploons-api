import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { StatusCodes } from "http-status-codes";
import { formatPagination } from "@utils/pagination.utils";

export class SavedService {
    private mapRelationship(profile: any, currentUserId?: string) {
        const iAmFollowing = currentUserId ? profile.followers?.length > 0 : false;
        const isFollowingMe = currentUserId ? profile.following?.length > 0 : false;
        return {
            i_am_following: iAmFollowing,
            is_following_me: isFollowingMe,
            is_mutual: iAmFollowing && isFollowingMe,
            is_me: profile.id === currentUserId
        };
    };

    // 1. Toggle Save (save / unsave)
    async toggleSave(userId: string, recipeId: string) {
        // 1. validate recipe
        const recipe = await prisma.recipes.findUnique({ where: { id: recipeId } });
        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }
        if (!recipe.is_published && recipe.user_id !== userId) {
            throw new AppError("Unauthorized", StatusCodes.FORBIDDEN);
        }
        // 2. get save if exist
        const existingSave = await prisma.saved_recipes.findUnique({
            where: {
                user_id_recipe_id: { user_id: userId, recipe_id: recipeId }
            }
        });
        // 3. unsave if exist save
        if (existingSave) {
            await prisma.saved_recipes.delete({
                where: {
                    user_id_recipe_id: { user_id: userId, recipe_id: recipeId }
                }
            });
            return { status: "unsaved" };
        }
        // save
        await prisma.saved_recipes.create({
            data: { user_id: userId, recipe_id: recipeId }
        });
        return { status: "saved" };
    }

    // 2. get my save recipes
    async getMySavedRecipes(userId: string, page: number = 1, limit: number = 10) {
        // 1. get skip
        const skip = (page - 1) * limit;
        // 2. get saved recipes
        const [saved, total] = await prisma.$transaction([
            prisma.saved_recipes.findMany({
                where: { user_id: userId },
                take: limit,
                skip: skip,
                orderBy: { saved_at: 'desc' },
                include: {
                    recipes: {
                        include: {
                            //author
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
                            },
                            _count: { select: { likes: true, comments: true, shared_recipes: true, saved_recipes: true } }
                        }
                    }
                }
            }),
            prisma.saved_recipes.count({ where: { user_id: userId } })
        ]);

        const data = saved.map((entry) => {
            const recipe = entry.recipes;
            const { profiles, _count, ...data } = recipe;
            return {
                saved_at: entry.saved_at,
                recipe_id: entry.recipe_id,
                user_id: entry.user_id,
                recipe: {
                    ...data,
                    stats: {
                        ..._count
                    },
                    author: {
                        ...profiles,
                        relationship: this.mapRelationship(profiles, userId)
                    },
                },
            };
        });

        return formatPagination(data, page, limit, total);
    }
}