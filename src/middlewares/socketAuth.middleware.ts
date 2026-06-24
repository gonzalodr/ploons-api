import { Socket } from 'socket.io';
import { supabase } from '@config/supabase.config';

/**
 * Middleware to authenticate socket connections using Supabase
 */
export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('unauthorized: No token provided'));
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new Error('unauthorized: Invalid token'));
    }

    // Inject user into socket data
    socket.data.userId = user.id;
    next();
  } catch (err) {
    next(new Error('unauthorized: Auth error'));
  }
};
