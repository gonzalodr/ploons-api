import { prisma } from "@config/db.config";
import { AppError } from "@utils/appError.utils";
import { StatusCodes } from "http-status-codes";


export class CommentService {
    //helper to relationship
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
    // 1. create comment
    async createComment(userId: string, content: string, recipeId?: string, parentId?: string) {
        // 1. is replies comment
        if (parentId) {
            const parentComment = await prisma.comments.findUnique({
                where: { id: parentId }
            });

            if (!parentComment) {
                throw new AppError('Parent comment not found', StatusCodes.NOT_FOUND);
            }

            // replies comment parent
            return await prisma.comments.create({
                data: {
                    user_id: userId,
                    recipe_id: parentComment.recipe_id,
                    content: content,
                    parent_id: parentId
                },
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
            });
        }

        // 2. if create new parent comment
        if (!recipeId) {
            throw new AppError('Recipe ID is required for new comments', StatusCodes.BAD_REQUEST);
        }
        // 3. validate recipe 
        const recipe = await prisma.recipes.findUnique({ where: { id: recipeId } });
        if (!recipe) {
            throw new AppError('Recipe not found', StatusCodes.NOT_FOUND);
        }
        // 4. create parent comment
        return await prisma.comments.create({
            data: {
                user_id: userId,
                recipe_id: recipeId,
                content: content,
                parent_id: null
            },
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
        });
    }
    // 2. update comment
    async updateComment(userId: string, commentId: string, content: string) {
        // 1. validate comment
        const comment = await prisma.comments.findUnique({ where: { id: commentId } });

        if (!comment) {
            throw new AppError("Comment not found", StatusCodes.NOT_FOUND);
        }
        if (comment.user_id !== userId) {
            throw new AppError("Unauthorized", StatusCodes.FORBIDDEN);
        }
        // 2. update comment
        return await prisma.comments.update({
            where: { id: commentId },
            data: { content: content },
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
        });
    }
    // 3. get comment response ( respuestas a un comentario padre incluso los anidados, paginado.)
    async getCommentReplies(parentId: string, page: number = 1, limit: number = 10, userId?: string) {
        // 1. get skip
        const skip = (page - 1) * limit;
        // 2. get comments replies
        const [replies, total] = await prisma.$transaction([
            prisma.comments.findMany({
                where: { parent_id: parentId },
                take: limit,
                skip: skip,
                orderBy: { created_at: 'asc' },
                include: {
                    // authors reply
                    profiles: {
                        select: {
                            id: true, username: true, first_name: true, last_name: true, avatar_url: true,
                            ...(userId && {
                                followers: { where: { follower_id: userId } },
                                following: { where: { following_id: userId } }
                            })
                        }
                    },
                    // replyng to
                    comments: {
                        select: {
                            profiles: {
                                select: {
                                    id: true, username: true, first_name: true, last_name: true, avatar_url: true,
                                    ...(userId && {
                                        followers: { where: { follower_id: userId } },
                                        following: { where: { following_id: userId } }
                                    })
                                }
                            }
                        }
                    },
                    _count: { select: { other_comments: true } },
                }
            }),
            prisma.comments.count({ where: { parent_id: parentId } })
        ]);


        const data = replies.map(reply => ({
            id: reply.id,
            content: reply.content,
            created_at: reply.created_at,
            replies_count: reply._count.other_comments,
            author: {
                id: reply.profiles.id,
                username: reply.profiles.username,
                first_name: reply.profiles.first_name,
                last_name: reply.profiles.last_name,
                avatar_url: reply.profiles.avatar_url,
                relationship: this.mapRelationship(reply.profiles, userId)
            },
            replying_to: {
                id: reply.comments?.profiles.id,
                username: reply.comments?.profiles.username,
                first_name: reply.comments?.profiles.first_name,
                last_name: reply.comments?.profiles.last_name,
                avatar_url: reply.comments?.profiles.avatar_url,
                relationship: reply.comments ? this.mapRelationship(reply.comments.profiles, userId) : null
            }
        }));

        return {
            data: data,
            pagination: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit),
                hasMore: skip + data.length < total
            }
        };
    }
    // 4. get all parent comment (paginado)
    async getRecipeParentComments(recipeId: string, page: number = 1, limit: number = 20, userId?: string) {
        // 1. get skip
        const skip = (page - 1) * limit;
        // 2. parents comments
        const [comments, total] = await prisma.$transaction([
            prisma.comments.findMany({
                where: {
                    recipe_id: recipeId,
                    parent_id: null
                },
                take: limit,
                skip: skip,
                orderBy: { created_at: 'desc' },
                // data
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
                    },
                    _count: { select: { other_comments: true } }
                }
            }),
            prisma.comments.count({ where: { recipe_id: recipeId, parent_id: null } })
        ]);
        const data = comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            replies_count: comment._count.other_comments,
            author: {
                id: comment.profiles.id,
                username: comment.profiles.username,
                first_name: comment.profiles.first_name,
                last_name: comment.profiles.last_name,
                avatar_url: comment.profiles.avatar_url,
                relationship: this.mapRelationship(comment.profiles, userId)
            }
        }));

        return {
            data: data,
            pagination: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit),
                hasMore: skip + data.length < total
            }
        };
    }
    // 5. delete only my commnents or commnets in my post
    async deleteComment(userId: string, commentId: string) {
        // 1. calidate comment
        const comment = await prisma.comments.findUnique({ where: { id: commentId } });

        if (!comment) {
            throw new AppError("Comment not found", StatusCodes.NOT_FOUND);
        }

        const recipe = await prisma.recipes.findUnique({ where: { id: comment.recipe_id } });

        // 2. validate is mine comment
        if (comment.user_id !== userId && recipe?.user_id !== userId) {
            throw new AppError("You can only delete your own comments or comments in your post", StatusCodes.FORBIDDEN);
        }
        // 3. delete comment
        await prisma.comments.delete({
            where: { id: commentId }
        });

        return comment;
    }
};