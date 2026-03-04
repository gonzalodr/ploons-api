import { Request, Response } from 'express';
import { toLowerCase, z, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

import { AuthService } from 'src/modules/auth/auth.service';
import { formatError } from '@utils/zodError.utils';
import { AppError } from '@utils/appError.utils';
import { forgotPasswordSchema, resetPasswordSchema } from 'src/modules/auth/schemas/auth.resetpass.schema';
import { registerSchema } from 'src/modules/auth/schemas/auth.register.schema';
import { loginSchema } from 'src/modules/auth/schemas/auth.login.schema';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }
  /*-------------------------------------
   *      REGISTER PROCESS
   *-------------------------------------*/
  // 1. register
  async register(req: Request, res: Response) {
    try {
      // 1. zod validate
      const validateData = registerSchema.parse(req.body);
      // 2. call auth services
      const result = await this.authService.register(validateData);
      // 3. response
      return res.status(StatusCodes.CREATED).json(result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
  // 2. validate registration
  async verifyRegister(req: Request, res: Response) {
    try {
      const { email, token } = req.body;
      if (!email || !z.email().safeParse(email).success) {
        throw new AppError("Invalid Email format", StatusCodes.BAD_REQUEST);
      }
      if (!token || !z.string().safeParse(token).success) {
        throw new AppError("Invalid token format", StatusCodes.BAD_REQUEST);
      }
      const result = await this.authService.verifyRegistration(email, token);
      return res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
  // 3. login
  async login(req: Request, res: Response) {
    try {
      // 1. zod validation
      const validatedData = loginSchema.parse(req.body);
      // 2. call auth services
      const result = await this.authService.login(validatedData);
      // 3. response
      return res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  };
  /*-------------------------------------
   *      RESET PASSWORD PROCESS
   *-------------------------------------*/
  // 4. send email to reset password Code
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await this.authService.sendPasswordResetEmail(email);
      return res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
  // 5. verify opt
  async verifyResetOtp(req: Request, res: Response) {
    try {
      // 1. get data
      const { email, token } = req.body;
      // 2. validate
      if (!email || !z.email().safeParse(email).success) {
        throw new AppError("Invalid Email format", StatusCodes.BAD_REQUEST);
      }
      if (!token || !z.string().safeParse(token).success) {
        throw new AppError("Invalid token format", StatusCodes.BAD_REQUEST);
      }
      // 3. call service
      const result = await this.authService.verifyResetPasswordOtp(email, token);
      // 4. send result
      return res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      return this.handleError(res, error);
    }
  }
  // 6. reset password
  async resetPassword(req: Request, res: Response) {
    try {
      const { password } = resetPasswordSchema.parse(req.body);
      const token = req.token as string;
      const refresh_token = req.token as string;

      await this.authService.updatePassword(password, token, refresh_token);
      return res.status(StatusCodes.OK).json({ message: "Contraseña actualizada correctamente" });
    } catch (error: any) {
      this.handleError(res, error);
    }
  }
  // 7. refresh token
  async refresh(req: Request, res: Response) {
    try {
      console.log("refresh token")
      // 1. get data
      const refreshToken = req.refreshToken;
      // 2. validate data
      if (!refreshToken || !z.string().safeParse(refreshToken).success) {
        throw new AppError('Refresh token is required', StatusCodes.BAD_REQUEST);
      }
      // 3. call service
      const result = await this.authService.refreshToken(refreshToken);
      // 4. send result
      return res.status(StatusCodes.OK).json(result);
    } catch (error) {
      console.log(error);
      this.handleError(res, error);
    }
  }
  // 8. logout
  async logout(req: Request, res: Response) {
    try {
      const token = req.token!;
      const { refreshToken } = req.body;
      const result = await this.authService.logout(token, refreshToken);
      return res.status(StatusCodes.OK).json(result);
    } catch (error: any) {
      this.handleError(res, error);
    }
  }
  // handle errors
  private handleError(res: Response, error: any) {
    if (error instanceof ZodError) {
      return res.status(StatusCodes.BAD_REQUEST).json(formatError(error));
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};