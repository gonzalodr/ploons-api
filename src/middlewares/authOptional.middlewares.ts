import { Request, Response, NextFunction } from 'express';
import { supabase } from '@config/supabase.config';

export async function authOptional(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // 1.validate token and next
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // 2. get token
  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return next();
  }

  try {
    // 3. validate token and inject
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      req.user = user;
      req.token = token;
    }
    next();
  } catch (err) {
    next();
  }
}