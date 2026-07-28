import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ChatService } from './chat.service';
import { catchAsync } from '@utils/catchAsync.utils';
import { sendMessageSchema, getMessagesSchema } from '@module/chat/schemas/chat.schema';
import { AppError } from '@utils/appError.utils';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * Get all conversations for current user
   */
  getConversations = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('unauthorized', StatusCodes.UNAUTHORIZED);

    const conversations = await this.chatService.getUserConversations(userId);

    // Transform result to show the "other user" more easily
    const result = conversations.map(conv => {
      const otherUser = conv.user1_id === userId
        ? conv.profiles_conversations_user2_idToprofiles
        : conv.profiles_conversations_user1_idToprofiles;

      return {
        id: conv.id,
        last_message_at: conv.last_message_at,
        last_message: conv.messages[0]?.content || null,
        other_user: otherUser
      };
    });

    return res.status(StatusCodes.OK).json(result);
  });

  /**
   * Get messages from a conversation
   */
  getMessages = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('No autorizado', StatusCodes.UNAUTHORIZED);

    const { conversation_id } = getMessagesSchema.parse(req.params);
    const messages = await this.chatService.getMessages(conversation_id, userId);

    // Mark messages as read when fetched
    await this.chatService.markAsRead(conversation_id, userId);

    return res.status(StatusCodes.OK).json(messages);
  });

  /**
   * Send a message (HTTP fallback or for non-realtime)
   */
  sendMessage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new AppError('unauthorized', StatusCodes.UNAUTHORIZED);

    const { recipient_id, content } = sendMessageSchema.parse(req.body);
    const message = await this.chatService.sendMessage(userId, recipient_id, content);

    return res.status(StatusCodes.CREATED).json(message);
  });
}
