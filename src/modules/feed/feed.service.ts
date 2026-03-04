import { prisma } from "@config/db.config";
import { string } from "zod";

export class FeedService {
    // 1. get feed
    async getFollowingFeed(userId: string, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        // 1. get my followings 
        const following = await prisma.follows.findMany({
            where: { follower_id: userId },
            select: { following_id: true }
        });

        const followingIds = following.map(f => f.following_id);
        // 2. validate 
        if (followingIds.length === 0) {
            return {
                data: [],
                pagination: {
                    page,
                    limit,
                    hasMore: false,
                }
            };
        }


        // 3. get feed
        const feedItems: any[] = await prisma.$queryRaw`
                (
                    SELECT 
                        r.id as activity_id,
                        'post' as type,
                        NULL as shared_comment,
                        r.created_at as activity_date,
                        r.id as recipe_id, 
                        r.title, 
                        r.image_url, 
                        r.description,
                        r.created_at as date,
                        r.updated_at as date_edit,
                        
                        -- profile share == profile post

                        p.id as sharer_id,
                        p.username as sharer_username,
                        p.first_name as share_first_name,
                        p.last_name as share_last_name,
                        p.avatar_url as sharer_avatar,
                        -- 
                        p.id as author_id,
                        p.username as author_username,
                        p.first_name as author_first_name,
                        p.last_name as author_last_name,
                        p.avatar_url as author_url,

                        -- my reactions exist
                        EXISTS(SELECT 1 FROM public.likes WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_liked,
                        EXISTS(SELECT 1 FROM public.comments WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_commented,
                        EXISTS(SELECT 1 FROM public.shared_recipes WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_shared,
                        EXISTS(SELECT 1 FROM public.saved_recipes WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_saved,
                        
                        -- count likes, comments, shares, saves
                        (SELECT COUNT(*)::INTEGER FROM public.likes WHERE recipe_id = r.id) as likes_count,
                        (SELECT COUNT(*)::INTEGER FROM public.comments WHERE recipe_id = r.id) as comments_count,
                        (SELECT COUNT(*)::INTEGER FROM public.shared_recipes WHERE recipe_id = r.id) as shares_count,
                        (SELECT COUNT(*)::INTEGER FROM public.saved_recipes WHERE recipe_id = r.id) as saves_count

                    FROM public.recipes r
                    JOIN public.profiles p ON r.user_id = p.id
                    WHERE r.user_id IN (${followingIds.join(',')}) 
                    AND r.is_published = true
                )
                UNION ALL
                (
                    SELECT 
                        s.id as activity_id,
                        'share' as type,
                        s.comment as shared_comment,
                        s.created_at as activity_date,
                        r.id as recipe_id, 
                        r.title, 
                        r.image_url, 
                        r.description,
                        r.created_at as date,
                        r.updated_at as date_edit,

                        -- profile share

                        p_sharer.id as sharer_id,
                        p_sharer.username as sharer_username,
                        p_sharer.first_name as share_first_name,
                        p_sharer.last_name as share_last_name,
                        p_sharer.avatar_url as sharer_avatar,

                        -- profile post

                        p_author.id as author_id,
                        p_author.username as author_username
                        p_author.first_name as author_first_name,
                        p_author.last_name as author_last_name,
                        p_author.avatar_url as author_url,

                        -- my reactions exist
                        EXISTS(SELECT 1 FROM public.likes WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_liked,
                        EXISTS(SELECT 1 FROM public.comments WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_commented,
                        EXISTS(SELECT 1 FROM public.shared_recipes WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_shared,
                        EXISTS(SELECT 1 FROM public.saved_recipes WHERE recipe_id = r.id AND user_id = ${userId}::uuid) as is_saved,

                        -- counts
                        (SELECT COUNT(*)::INTEGER FROM public.likes WHERE recipe_id = r.id) as likes_count,
                        (SELECT COUNT(*)::INTEGER FROM public.comments WHERE recipe_id = r.id) as comments_count,
                        (SELECT COUNT(*)::INTEGER FROM public.shared_recipes WHERE recipe_id = r.id) as shares_count,
                        (SELECT COUNT(*)::INTEGER FROM public.saved_recipes WHERE recipe_id = r.id) as saves_count

                    FROM public.shared_recipes s
                    JOIN public.recipes r ON s.recipe_id = r.id
                    JOIN public.profiles p_sharer ON s.user_id = p_sharer.id
                    JOIN public.profiles p_author ON r.user_id = p_author.id
                    WHERE s.user_id IN (${followingIds.join(',')})
                    AND r.is_published = true
                )
                ORDER BY activity_date DESC
                LIMIT ${limit + 1} OFFSET ${skip}
            `;

        // 3. infinite scroll logic
        const hasMore = feedItems.length > limit;
        const data = hasMore ? feedItems.slice(0, limit) : feedItems;

        return {
            data,
            pagination: {
                page,
                limit,
                hasMore
            }
        };
    }
    // 2. get trendings
    async getTrendingFeed(page: number = 1, limit: number = 10, userId?:string) {
        // 1. get data
        const skip = (page - 1) * limit;
        const timeframe = '48 hours';
        const currentUserId = userId || null;
        // 2. trending
        const trendingRecipes: any[] = await prisma.$queryRaw`
            SELECT 
                r.id as activity_id,
                'trending_post' as type,
                NULL as shared_comment,
                r.created_at as activity_date,
                r.id as recipe_id, 
                r.title, 
                r.image_url, 
                r.description,
                r.created_at as date,
                r.updated_at as date_edit,

                -- Atributos de usuario unificados
                p.id as sharer_id,
                p.username as sharer_username,
                p.first_name as share_first_name,
                p.last_name as share_last_name,
                p.avatar_url as sharer_avatar,
                
                p.id as author_id,
                p.username as author_username,
                p.first_name as author_first_name,
                p.last_name as author_last_name,
                p.avatar_url as author_url,
                
                -- get user
                EXISTS(SELECT 1 FROM public.likes WHERE recipe_id = r.id AND user_id = ${userId??null}::uuid) as is_liked,
                EXISTS(SELECT 1 FROM public.comments WHERE recipe_id = r.id AND user_id = ${userId??null}::uuid) as is_commented,
                EXISTS(SELECT 1 FROM public.shared_recipes WHERE recipe_id = r.id AND user_id = ${userId??null}::uuid) as is_shared,
                EXISTS(SELECT 1 FROM public.saved_recipes WHERE recipe_id = r.id AND user_id = ${userId??null}::uuid) as is_saved,
                
                (SELECT COUNT(*)::INTEGER FROM public.likes WHERE recipe_id = r.id) as likes_count,
                (SELECT COUNT(*)::INTEGER FROM public.comments WHERE recipe_id = r.id) as comments_count,
                (SELECT COUNT(*)::INTEGER FROM public.shared_recipes WHERE recipe_id = r.id) as shares_count,
                (SELECT COUNT(*)::INTEGER FROM public.saved_recipes WHERE recipe_id = r.id) as saves_count,

                -- calculate score
                (
                    (
                        (SELECT COUNT(*) FROM public.likes l WHERE l.recipe_id = r.id AND l.created_at > (NOW() - (${timeframe})::interval)) * 1 +
                        (SELECT COUNT(*) FROM public.shared_recipes s WHERE s.recipe_id = r.id AND s.shared_at > (NOW() - (${timeframe})::interval)) * 2 +
                        (SELECT COUNT(*) FROM public.comments c WHERE c.recipe_id = r.id AND c.created_at > (NOW() - (${timeframe})::interval)) * 3
                    )::INTEGER
                ) as trending_score

            FROM public.recipes r
            JOIN public.profiles p ON r.user_id = p.id
            WHERE r.is_published = true
            ORDER BY trending_score DESC, r.created_at DESC
            LIMIT ${limit + 1} OFFSET ${skip}
        `;

        const hasMore = trendingRecipes.length > limit;
        const data = hasMore ? trendingRecipes.slice(0, limit) : trendingRecipes;

        return {
            data,
            pagination: {
                page,
                limit,
                hasMore
            }
        };
    }
}