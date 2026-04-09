import { StatusCodes } from "http-status-codes";
import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { CloudinaryService } from "@utils/cloudinary.utils";
import { UpdateRecipeInput } from "@module/recipe/schemas/recipe.update.schema";
import { CreateRecipeInput } from "@module/recipe/schemas/recipe.create.schema";


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
                // add ingredients
                recipe_ingredients: {
                    create: data.ingredients.map((ing: any) => ({
                        name: ing.name,
                        amount: ing.amount,
                        unit: ing.unit,
                        order_index: ing.order_index
                    }))
                },
                // add steps
                recipe_steps: {
                    create: data.steps.map((step: any) => ({
                        step_number: step.step_number,
                        instruction: step.instruction,
                    }))
                }
            },
            include: { recipe_ingredients: true, recipe_steps: true }
        });

        // 2. update file to cloudinary
        let image_url: string | undefined = undefined;
        if (file) {
            const result = await CloudinaryService.uploadBuffer(file.buffer, 'recipe', `recipe_${create.id}`);
            image_url = result.url
        }
        //3. update url file in recipe
        return await prisma.recipes.update({
            where: {
                id: create.id,
                user_id: userId
            },
            data: {
                image_url: image_url
            },
            include: {
                recipe_ingredients: true,
                recipe_steps: true,
            }
        })
    }
    // 2. update recipe
    async updateRecipe(userId: string, recipeId: string, data: UpdateRecipeInput, file?: Express.Multer.File) {
        // 1. validate if recipe user
        const recipe = await prisma.recipes.findFirst({ where: { id: recipeId, user_id: userId } })
        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }
        // 2. upload new image
        let image_url = recipe.image_url;
        if (file) {
            const uploadResult = await CloudinaryService.uploadBuffer(file.buffer, 'recipe', `recipe_${recipe.id}`);
            image_url = uploadResult.url;
        }
        // 3. Transacción de actualización
        return await prisma.recipes.update({
            where: { id: recipe.id, user_id: recipe.user_id },
            data: {
                title: data.title,
                description: data.description,
                image_url: image_url,
                prep_time_mins: data.prep_time_mins,
                difficulty: data.difficulty,
                calories: data.calories,
                is_published: data.is_published,

                // SYNC INGREDIENTS
                recipe_ingredients: {
                    // A. delete ingredients.
                    deleteMany: {
                        id: { notIn: data.ingredients?.filter((i: any) => i.id).map((i: any) => i.id) }
                    },
                    // B. insert or update ingredients
                    upsert: data.ingredients?.map((ing: any) => ({
                        where: { id: ing.id || '00000000-0000-0000-0000-000000000000' }, // uuid 
                        update: { name: ing.name, amount: ing.amount, unit: ing.unit, order_index: ing.order_index },
                        create: { name: ing.name, amount: ing.amount, unit: ing.unit, order_index: ing.order_index }
                    }))
                },

                // SYNC STEPS
                recipe_steps: {
                    //1. delete steps
                    deleteMany: {
                        id: { notIn: data.steps?.filter((s: any) => s.id).map((s: any) => s.id) }
                    },
                    //2. create or update steps
                    upsert: data.steps?.map((step: any) => ({
                        where: { id: step.id || '00000000-0000-0000-0000-000000000000' },// uuid
                        update: { step_number: step.step_number, instruction: step.instruction },
                        create: { step_number: step.step_number, instruction: step.instruction }
                    }))
                }
            },
            include: { recipe_ingredients: true, recipe_steps: true }
        });
    }
    // 3. delete recipe
    async deleteRecipe(userId: string, recipeId: string) {
        const recipe = await prisma.recipes.findFirst({ where: { id: recipeId, user_id: userId } })
        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }
        return await prisma.recipes.delete({ where: { id: recipe.id, user_id: recipe.user_id } });
    }
    // 4. get public recipe
    async getRecipeById(recipeId: string, userId?: string) {
        const recipe = await prisma.recipes.findFirst({
            where: {
                id: recipeId,
                is_published: true
            },
            include: {
                // order by order index
                recipe_ingredients: {
                    orderBy: {
                        order_index: 'asc'
                    }
                },
                // order by steps
                recipe_steps: {
                    orderBy: {
                        step_number: 'asc'
                    }
                },
                // profil author
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
                // count likes and comments
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        saved_recipes: true,
                        shared_recipes: true
                    }
                }
            }
        })
        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }
        // relationship
        const author = recipe.profiles as any;
        const iFollowAuthor = userId ? author.followers?.length > 0 : false;
        const authorFollowsMe = userId ? author.following?.length > 0 : false;

        const { _count, profiles, ...recipeData } = recipe;
        return {
            ...recipeData,
            // stats
            stats: {
                likes: _count.likes,
                comments: _count.comments,
                saves: _count.saved_recipes,
                shares: _count.shared_recipes
            },
            // author
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
                    is_me: author.id === userId
                }
            }
        };
    }
    // 5. get private recipe (own recipe)
    async getPrivateRecipeById(userId: string, recipeId: string) {
        const recipe = await prisma.recipes.findFirst({
            where: {
                id: recipeId,
                user_id: userId,
                is_published: false
            },
            include: {
                // order by order index
                recipe_ingredients: {
                    orderBy: {
                        order_index: 'asc'
                    }
                },
                // order by steps
                recipe_steps: {
                    orderBy: {
                        step_number: 'asc'
                    }
                },
                // add profil
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
                        saved_recipes: true
                    }
                }
            }
        })
        if (!recipe) {
            throw new AppError("Recipe not found", StatusCodes.NOT_FOUND);
        }
        const author = recipe.profiles as any;
        const { _count, profiles, ...recipeData } = recipe;
        return {
            ...recipeData,
            // stats
            stats: {
                likes: _count.likes,
                comments: _count.comments,
                saves: _count.saved_recipes,
                shares: _count.shared_recipes
            },
            // author
            author: {
                id: author.id,
                username: author.username,
                first_name: author.first_name,
                last_name: author.last_name,
                avatar_url: author.avatar_url,
                relationship: {
                    i_am_following: false,
                    is_following_me: false,
                    is_mutual: false,
                    is_me: true
                }
            }
        };
    }
    // 6. get list of my recipes
    async getMyListRecipes(userId: string, page: number = 1, limit: number = 10) {
        // 1. get skips
        const skip = (page - 1) * limit;
        // 2. select recipes
        const [recipes, total] = await prisma.$transaction([
            prisma.recipes.findMany({
                where: { user_id: userId },
                take: limit,
                skip: skip,
                orderBy: { created_at: 'desc' }, //order by creation
                select: {
                    id: true,
                    image_url: true,
                    title: true,
                    description: true,
                    is_published: true,
                    created_at: true,
                    updated_at: true,
                    // 2. get only esential user data
                    profiles: {
                        select: {
                            id: true,
                            username: true,
                            first_name: true,
                            last_name: true,
                            avatar_url: true
                        }
                    },
                    // 3. get count likes and comments
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
            //get total recipes
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

        return {
            data: data,
            pagination: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit),
                hasMore: skip + recipes.length < total
            }
        };
    }
};