import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { StatusCodes } from "http-status-codes";

export class SharedService {
    // 1. shared
    async registerShare(userId: string, recipeId: string, comment?: string) {
        // 1. validate shared
        const recipe = await prisma.recipes.findUnique({ where: { id: recipeId } });
        // 2. validate shared
        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }
        // 3. shared recipe
        return await prisma.shared_recipes.create({
            data: {
                user_id: userId,
                recipe_id: recipeId,
                comment: comment
            },
            include: {
                recipes: true,
                profiles: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true,
                        avatar_url: true
                    }
                }
            }
        });
    }
    // 2. get shareds
    async getMySharedRecipes(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [shared, total] = await prisma.$transaction([
            prisma.shared_recipes.findMany({
                where: { user_id: userId },
                take: limit,
                skip: skip,
                orderBy: { shared_at: 'desc' },
                include: {
                    recipes: {
                        include: {
                            profiles: {
                                select: {
                                    id: true,
                                    username: true,
                                    first_name: true,
                                    last_name: true,
                                    avatar_url: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.shared_recipes.count({ where: { user_id: userId } })
        ]);

        return {
            shared_items: shared,
            meta: { total, page, last_page: Math.ceil(total / limit) }
        };
    }
}