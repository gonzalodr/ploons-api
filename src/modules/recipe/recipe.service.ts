import { StatusCodes } from "http-status-codes";
import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { ImageManagerService } from "@utils/imageManager.utils";
import { UpdateRecipeInput } from "src/modules/recipe/schemas/recipe.update.schema";
import { CreateRecipeInput } from "src/modules/recipe/schemas/recipe.create.schema";
import { formatPagination } from "@utils/pagination.utils";

export class RecipeService {
    // 1. create recipe
    async createRecipe(userId: string, data: CreateRecipeInput, file?: Express.Multer.File) {
        // 1. create recipe in db
        const create = await prisma.recipes.create({
            data: {
                user_id: userId,
                title: data.title,
                description: data.description,
                prep_time_mins: data.prep_time_mins,
                difficulty: data.difficulty,
                calories: data.calories,
                is_published: data.is_published,
                recipe_ingredients: {
                    create: data.ingredients.map((ing, idx) => ({
                        name: ing.name,
                        amount: ing.amount,
                        unit: ing.unit,
                        order_index: ing.order_index ?? idx
                    }))
                },
                recipe_steps: {
                    create: data.steps.map((step, idx) => ({
                        step_number: step.step_number ?? idx + 1,
                        instruction: step.instruction,
                    }))
                }
            },
            include: { recipe_ingredients: true, recipe_steps: true }
        });

        // 2. upload image to cloudinary
        let image_url: string | undefined = undefined;
        if (file) {
            const result = await ImageManagerService.uploadAndReplace(
                file.buffer,
                'recipe',
                `recipe_${create.id}`,
                null
            );
            image_url = result;
        }

        // 3. update recipe with image url
        return await prisma.recipes.update({
            where: { id: create.id, user_id: userId },
            data: { image_url },
            include: {
                recipe_ingredients: { orderBy: { order_index: 'asc' } },
                recipe_steps: { orderBy: { step_number: 'asc' } },
            }
        });
    }

    // 2. update recipe
    async updateRecipe(userId: string, recipeId: string, data: UpdateRecipeInput, file?: Express.Multer.File) {
        // 1. validate recipe exists and belongs to user
        const recipe = await prisma.recipes.findFirst({
            where: { id: recipeId, user_id: userId }
        });
        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }

        // 2. handle image upload/deletion
        let image_url = recipe.image_url;

        if (file) {
            image_url = await ImageManagerService.uploadAndReplace(
                file.buffer,
                'recipe',
                `recipe_${recipe.id}`,
                recipe.image_url
            );
        }

        if (data.delete_image && recipe.image_url) {
            await ImageManagerService.deleteImage(recipe.image_url);
            image_url = null;
        }

        // 3. prepare update data
        const updateData: any = {
            title: data.title,
            description: data.description,
            image_url: image_url,
            prep_time_mins: data.prep_time_mins,
            difficulty: data.difficulty,
            calories: data.calories,
            is_published: data.is_published,
        };

        // 4. sync ingredients (delete all + create new - safe approach)
        if (data.ingredients !== undefined) {
            updateData.recipe_ingredients = {
                deleteMany: {},
                create: data.ingredients.map((ing, idx) => ({
                    name: ing.name,
                    amount: ing.amount,
                    unit: ing.unit,
                    order_index: ing.order_index ?? idx
                }))
            };
        }

        // 5. sync steps (delete all + create new - safe approach)
        if (data.steps !== undefined) {
            updateData.recipe_steps = {
                deleteMany: {},
                create: data.steps.map((step, idx) => ({
                    step_number: step.step_number ?? idx + 1,
                    instruction: step.instruction,
                }))
            };
        }

        // 6. execute update
        return await prisma.recipes.update({
            where: { id: recipe.id, user_id: recipe.user_id },
            data: updateData,
            include: {
                recipe_ingredients: { orderBy: { order_index: 'asc' } },
                recipe_steps: { orderBy: { step_number: 'asc' } },
            }
        });
    }

    // 3. delete recipe
    async deleteRecipe(userId: string, recipeId: string) {
        const recipe = await prisma.recipes.findFirst({
            where: { id: recipeId, user_id: userId },
            select: { id: true, image_url: true }
        });

        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }

        if (recipe.image_url) {
            await ImageManagerService.deleteImage(recipe.image_url);
        }

        return await prisma.recipes.delete({
            where: { id: recipe.id, user_id: userId }
        });
    }

    // 4. get public recipe (refactorizado)
    async getRecipeById(recipeId: string, userId?: string) {
        return this.getRecipeBase(
            { id: recipeId, is_published: true },
            userId
        );
    }

    // 5. get private recipe (refactorizado)
    async getPrivateRecipeById(userId: string, recipeId: string) {
        return this.getRecipeBase(
            { id: recipeId, user_id: userId, is_published: false },
            userId
        );
    }

    // 6. método base privado para evitar duplicación
    private async getRecipeBase(where: any, userId?: string) {
        const recipe = await prisma.recipes.findFirst({
            where,
            include: {
                recipe_ingredients: { orderBy: { order_index: 'asc' } },
                recipe_steps: { orderBy: { step_number: 'asc' } },
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
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        saved_recipes: true,
                        shared_recipes: true,
                    }
                }
            }
        });

        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }

        const author = recipe.profiles as any;
        const isMe = userId === author.id;
        const iFollowAuthor = userId && !isMe ? (author.followers?.length ?? 0) > 0 : false;
        const authorFollowsMe = userId && !isMe ? (author.following?.length ?? 0) > 0 : false;

        const { _count, profiles, ...recipeData } = recipe;

        return {
            ...recipeData,
            stats: {
                likes: _count.likes,
                comments: _count.comments,
                saves: _count.saved_recipes,
                shares: _count.shared_recipes,
            },
            author: {
                id: author.id,
                username: author.username,
                first_name: author.first_name,
                last_name: author.last_name,
                avatar_url: author.avatar_url,
                relationship: {
                    i_am_following: iFollowAuthor,
                    is_following_me: authorFollowsMe,
                    is_mutual: iFollowAuthor && authorFollowsMe,
                    is_me: isMe,
                },
            },
        };
    }

    // 7. get list of my recipes (optimizado)
    async getMyListRecipes(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        // Usar Promise.all en lugar de transaction (más eficiente)
        const [recipes, total] = await Promise.all([
            prisma.recipes.findMany({
                where: { user_id: userId },
                take: limit,
                skip: skip,
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    image_url: true,
                    title: true,
                    description: true,
                    is_published: true,
                    created_at: true,
                    updated_at: true,
                    profiles: {
                        select: {
                            id: true,
                            username: true,
                            first_name: true,
                            last_name: true,
                            avatar_url: true
                        }
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                            shared_recipes: true,
                            saved_recipes: true,
                        }
                    }
                }
            }),
            prisma.recipes.count({ where: { user_id: userId } })
        ]);

        const data = recipes.map(recipe => {
            const { _count, profiles, ...recipeData } = recipe;
            return {
                ...recipeData,
                stats: {
                    likes: _count.likes,
                    comments: _count.comments,
                    shares: _count.shared_recipes,
                    saves: _count.saved_recipes
                },
                author: {
                    ...profiles,
                    relationship: {
                        i_am_following: false,
                        is_following_me: false,
                        is_mutual: false,
                        is_me: true
                    }
                }
            };
        });

        return formatPagination(data, page, limit, total);
    }
}