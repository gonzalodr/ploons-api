import { z } from 'zod';

export const sendMessageSchema = z.object({
  recipient_id: z.string().uuid(),
  content: z.string().min(1)
});

export const getMessagesSchema = z.object({
  conversation_id: z.string().uuid()
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
