import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { supabase } from '@config/supabase.config';

export async function authOptional(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // 1. if dont have token, next, (visited)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  // 2. validate have a toke 
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    // 1. validate session
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Session expired or invalid token' });
    }
    // 2. inject user, token, refresh token
    req.user = user;
    req.token = token;
    req.refreshToken = req.headers['x-refresh-token'] as string;
    next();
  } catch (err) {
    next();
  }
};