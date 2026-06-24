import { Server, Socket } from 'socket.io';
import { ChatService } from '@module/chat/chat.service';
import { onlineUsers } from '@sockets/index';

const chatService = new ChatService();

export const chatSocketHandler = (io: Server, socket: Socket) => {
  // 1. Sending messages
  socket.on('send_message', async (data: { recipient_id: string; content: string }) => {
    const senderId = socket.data.userId;
    if (!senderId) return;

    try {
      const { recipient_id, content } = data;

      // Save to database
      const message = await chatService.sendMessage(senderId, recipient_id, content);

      // Emit to recipient room (all their tabs) if online
      if (onlineUsers.has(recipient_id)) {
        io.to(recipient_id).emit('receive_message', message);
      }

      // Confirm to sender (all their tabs)
      io.to(senderId).emit('message_sent', message);

    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // 2. Typing indicator
  socket.on('typing', (data: { recipient_id: string; isTyping: boolean }) => {
    const senderId = socket.data.userId;
    if (!senderId) return;

    if (onlineUsers.has(data.recipient_id)) {
      io.to(data.recipient_id).emit('user_typing', {
        sender_id: senderId,
        isTyping: data.isTyping
      });
    }
  });

  // 3. Mark as read
  socket.on('mark_read', async (data: { conversation_id: string }) => {
    const userId = socket.data.userId;
    if (!userId) return;

    try {
      await chatService.markAsRead(data.conversation_id, userId);
      // Optional: notify sender that their messages were read
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  });
};
