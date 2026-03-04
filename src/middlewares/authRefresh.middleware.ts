import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

const REFRESH_TOKEN_HEADER = 'x-refresh-token';

export function requireRefreshToken(req: Request, res: Response, next: NextFunction) {
  // 1. get refresh from headers
  const refreshToken = req.headers[REFRESH_TOKEN_HEADER] as string;
  // 2. validate
  if (!refreshToken) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Refresh token is required',
      message: 'X-Refresh-Token header is missing'
    });
  }
  // 3. inject refresh token in request
  req.refreshToken = refreshToken;
  next();
}