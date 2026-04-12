import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

import { AppError } from '@utils/appError.utils';
import { CommentService } from "@module/comment/comment.service";

export class CommentController {
    private commentService: CommentService;

    constructor() {
        this.commentService = new CommentService();
    }
    // 1. Create Comment
    async createComment(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const recipeId = req.params.recipeId as string;
            const parentId = req.params.parentId as string;
            const { content } = req.body;
            // 2. validations
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (recipeId && !z.uuid().safeParse(recipeId).success) {
                throw new AppError('Invalid Recipe ID format', StatusCodes.BAD_REQUEST);
            }
            if (!content || content.trim().length === 0) {
                throw new AppError('Content is required', StatusCodes.BAD_REQUEST);
            }
            if (parentId && !z.uuid().safeParse(parentId).success) {
                throw new AppError('Invalid Parent Comment ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.commentService.createComment(userId, content, recipeId, parentId);
            // 4. send result
            return res.status(StatusCodes.CREATED).json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 2. Update Comment
    async updateComment(req: Request, res: Response) {
        try {
            // 1. get dat
            const userId = req.user?.id;
            const commentId = req.params.commentId as string;
            const { content } = req.body;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (!commentId || !z.uuid().safeParse(commentId).success) {
                throw new AppError('Invalid Comment ID format', StatusCodes.BAD_REQUEST);
            }
            if (!content || content.trim().length === 0) {
                throw new AppError('Content is required to update', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.commentService.updateComment(userId, commentId, content);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 3. Get Comment Replies (Paginado)
    async getCommentReplies(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const parentId = req.params.parentId as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            // 2. validate
            if (!parentId || !z.uuid().safeParse(parentId).success) {
                throw new AppError('Invalid Parent Comment ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.commentService.getCommentReplies(parentId, page, limit, userId);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 4. Get Recipe Parent Comments (Paginado)
    async getRecipeParentComments(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const recipeId = req.params.recipeId as string;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            // 2. validate
            if (!recipeId || !z.uuid().safeParse(recipeId).success) {
                throw new AppError('Invalid Recipe ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.commentService.getRecipeParentComments(recipeId, page, limit, userId);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
    // 5. Delete Comment
    async deleteComment(req: Request, res: Response) {
        try {
            // 1. get data
            const userId = req.user?.id;
            const commentId = req.params.commentId as string;
            // 2. validate
            if (!userId || !z.uuid().safeParse(userId).success) {
                throw new AppError('Invalid User ID format', StatusCodes.BAD_REQUEST);
            }
            if (!commentId || !z.uuid().safeParse(commentId).success) {
                throw new AppError('Invalid Comment ID format', StatusCodes.BAD_REQUEST);
            }
            // 3. call service
            const result = await this.commentService.deleteComment(userId, commentId);
            // 4. send result
            return res.status(StatusCodes.OK).json(result);
        } catch (error: any) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
        }
    }
}