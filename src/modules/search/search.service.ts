import { prisma } from "@config/db.config";


export class SearchService {
    async searchProfiles(query: string, page: number = 1, limit: number = 10) {
        // 1. get skip
        const skip = (page - 1) * limit;
        // 2. get profiles
        const profiles: any[] = await prisma.$queryRaw`
            SELECT 
                id, 
                username, 
                first_name, 
                last_name, 
                avatar_url,
                GREATEST(
                    similarity(username, ${query}),
                    similarity(first_name || ' ' || last_name, ${query})
                ) as score
            FROM public.profiles
            WHERE 
                username % ${query} 
                OR first_name % ${query} 
                OR last_name % ${query}
                OR (first_name || ' ' || last_name) % ${query}
            ORDER BY score DESC
            LIMIT ${limit} OFFSET ${skip}
        `;

        // 3. get count result
        const countResult: any[] = await prisma.$queryRaw`
            SELECT COUNT(*) as total
            FROM public.profiles
            WHERE 
                username % ${query} 
                OR first_name % ${query} 
                OR last_name % ${query}
                OR (first_name || ' ' || last_name) % ${query}
        `;

        const total = Number(countResult[0].total);

        return {
            profiles: profiles,
            pagination: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit),
                hasMore: skip + profiles.length < total
            }
        };
    }

    async searchRecipes(query: string, page: number = 1, limit: number = 10) {
        // 1. get skip
        const skip = (page - 1) * limit;

        // 2. get recipes
        const recipes: any[] = await prisma.$queryRaw`
            SELECT DISTINCT ON (r.id) 
                r.id, 
                r.title, 
                r.description, 
                r.image_url,
                r.prep_time_mins, 
                r.difficulty,
                p.id as profile_id,
                p.username,
                p.first_name,
                p.last_name,
                similarity(r.title, ${query}) as score
            FROM public.recipes r
            JOIN public.profiles p ON r.user_id = p.id
            LEFT JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
            WHERE
                ( 
                r.title % ${query} 
                OR r.description % ${query} 
                OR ri.name % ${query}
                ) AND r.is_published = true
            ORDER BY r.id, score DESC
            LIMIT ${limit} OFFSET ${skip}
        `;

        // 3. get all resets
        const countResult: any[] = await prisma.$queryRaw`
            SELECT COUNT(DISTINCT r.id) as total
            FROM public.recipes r
            LEFT JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
            WHERE 
                r.title % ${query} 
                OR r.description % ${query} 
                OR ri.name % ${query}
        `;

        const total = Number(countResult[0].total);

        return {
            recipes: recipes,
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