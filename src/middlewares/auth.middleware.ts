import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { supabase } from '@config/supabase.config';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // 1. validate header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      error: 'Missing or invalid authorization header. Use: Bearer <token>' 
    });
  }

  // 2. get token
  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token missing' });
  }

  // 3.validate token in supabase auth
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    if (error.message?.toLowerCase().includes('expired')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Token expired' });
    }
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' });
  }
  // 4. validate get user
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'User not found' });
  }
  // 5. inject data
  req.user = user;
  req.token = token;
  next();
}