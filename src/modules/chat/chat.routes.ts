import { Router } from 'express';
import { ChatController } from './chat.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const chatController = new ChatController();

router.get('/conversations', authenticate, chatController.getConversations);
router.get('/messages/:conversation_id', authenticate, chatController.getMessages);
router.post('/send', authenticate, chatController.sendMessage);

export default router;
