import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { supabase } from '@config/supabase.config';


export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'No token provided' });
  }
  const refreshToken = req.headers['X-Refresh-Token'] as string;
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Invalid token' });
  }

  // save ID user on the request.user object 
  // use token to sing out, close session
  req.user = user;
  req.token = token;
  req.refreshToken = refreshToken;
  next();
};