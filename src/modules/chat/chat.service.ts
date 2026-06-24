import { prisma } from '@config/db.config';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@utils/appError.utils';

export class ChatService {
  /**
   * Get or create a 1-to-1 conversation
   */
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    if (user1Id === user2Id) {
      throw new AppError('No puedes chatear contigo mismo', StatusCodes.BAD_REQUEST);
    }

    // Sort IDs to ensure uniqueness in the unique constraint [user1Id, user2Id]
    const [u1, u2] = [user1Id, user2Id].sort();

    let conversation = await prisma.conversations.findUnique({
      where: {
        user1_id_user2_id: {
          user1_id: u1,
          user2_id: u2
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversations.create({
        data: {
          user1_id: u1,
          user2_id: u2
        }
      });
    }

    return conversation;
  }

  /**
   * Send a message
   */
  async sendMessage(senderId: string, recipientId: string, content: string) {
    const conversation = await this.getOrCreateConversation(senderId, recipientId);

    const message = await prisma.messages.create({
      data: {
        conversation_id: conversation.id,
        sender_id: senderId,
        content
      },
      include: {
        profiles: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            full_name: true
          }
        }
      }
    });

    // Update last_message_at in conversation
    await prisma.conversations.update({
      where: { id: conversation.id },
      data: { last_message_at: new Date() }
    });

    return message;
  }

  /**
   * Get messages from a conversation
   */
  async getMessages(conversationId: string, currentUserId: string) {
    // Verify user belongs to conversation
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || (conversation.user1_id !== currentUserId && conversation.user2_id !== currentUserId)) {
      throw new AppError('Conversación no encontrada o acceso denegado', StatusCodes.FORBIDDEN);
    }

    return prisma.messages.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: 'asc' },
      include: {
        profiles: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            full_name: true
          }
        }
      }
    });
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string) {
    return prisma.conversations.findMany({
      where: {
        OR: [
          { user1_id: userId },
          { user2_id: userId }
        ]
      },
      orderBy: { last_message_at: 'desc' },
      include: {
        profiles_conversations_user1_idToprofiles: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            full_name: true
          }
        },
        profiles_conversations_user2_idToprofiles: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
            full_name: true
          }
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' }
        }
      }
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string) {
    await prisma.messages.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        is_read: false
      },
      data: { is_read: true }
    });
  }
}
