import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { StatusCodes } from "http-status-codes";

export class SavedService {
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

        return {
            recipes: saved.map(s => s.recipes),
            meta: { total, page, last_page: Math.ceil(total / limit) }
        };
    }
}