import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

const REFRESH_TOKEN_HEADER = 'x-refresh-token';

export function validateRefreshToken(req: Request, res: Response, next: NextFunction) {
  const refreshToken = req.headers[REFRESH_TOKEN_HEADER] as string;
  if (!refreshToken || refreshToken.trim() === '') {
    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      error: 'Refresh token required',
      message: 'X-Refresh-Token header is missing or empty'
    });
  }
  // validate format
  if (refreshToken.length < 10) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      error: 'Invalid refresh token format'
    });
  }
  req.refreshToken = refreshToken;
  next();
}