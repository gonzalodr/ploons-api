import { Request, Response } from 'express';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

import { AuthService } from '@module/auth/auth.service';
import { AppError } from '@utils/appError.utils';
import { forgotPasswordSchema, resetPasswordSchema } from 'src/modules/auth/schemas/auth.resetpass.schema';
import { registerSchema } from 'src/modules/auth/schemas/auth.register.schema';
import { loginSchema } from 'src/modules/auth/schemas/auth.login.schema';
import { verifyOtpSchema } from './schemas/auth.verify.schema';
import { catchAsync } from '@utils/catchAsync.utils';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /*-------------------------------------
   *      REGISTER PROCESS
   *-------------------------------------*/
  // 1. register
  register = catchAsync(async (req: Request, res: Response) => {
    // 1. zod validate
    const validateData = registerSchema.parse(req.body);
    // 2. call auth services
    const result = await this.authService.register(validateData);
    // 3. response
    return res.status(StatusCodes.CREATED).json(result);
  });

  // 2. validate registration otp
  verifyRegister = catchAsync(async (req: Request, res: Response) => {
    const { email, token } = verifyOtpSchema.parse(req.body);
    const result = await this.authService.verifyRegistration(email, token);
    return res.status(StatusCodes.OK).json(result);
  });

  // 3. login
  login = catchAsync(async (req: Request, res: Response) => {
    // 1. zod validation
    const validatedData = loginSchema.parse(req.body);
    // 2. call auth services
    const result = await this.authService.login(validatedData);
    // 3. response
    return res.status(StatusCodes.OK).json(result);
  });

  /*-------------------------------------
   *      RESET PASSWORD PROCESS
   *-------------------------------------*/
  // 4. send email to reset password Code
  forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await this.authService.sendPasswordResetEmail(email);
    return res.status(StatusCodes.OK).json(result);
  });

  // 5. verify opt
  verifyResetOtp = catchAsync(async (req: Request, res: Response) => {
    // 1. get data
    const { email, token } = verifyOtpSchema.parse(req.body);
    // 2. call service
    const result = await this.authService.verifyResetPasswordOtp(email, token);
    // 3. send result
    return res.status(StatusCodes.OK).json(result);
  });

  // 6. reset password
  resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { password } = resetPasswordSchema.parse(req.body);
    const token = req.token as string;
    const refresh_token = req.refreshToken as string;

    if (!token || !refresh_token) {
      throw new AppError('Access token and refresh token required', StatusCodes.UNAUTHORIZED);
    }

    await this.authService.updatePassword(password, token, refresh_token);
    return res.status(StatusCodes.OK).json({ message: "Contraseña actualizada correctamente" });
  });

  // 7. refresh token
  refresh = catchAsync(async (req: Request, res: Response) => {
    // 1. get data
    const refreshToken = req.refreshToken as string;
    // 2. validate data
    if (!refreshToken || !z.string().safeParse(refreshToken).success) {
      throw new AppError('Refresh token is required', StatusCodes.BAD_REQUEST);
    }
    // 3. call service
    const result = await this.authService.refreshToken(refreshToken);
    // 4. send result
    return res.status(StatusCodes.OK).json(result);
  });

  // 8. logout
  logout = catchAsync(async (req: Request, res: Response) => {
    const token = req.token as string;
    const refreshToken = req.refreshToken as string;

    if (!token || !refreshToken) {
      throw new AppError('Access token and refresh token required', StatusCodes.UNAUTHORIZED);
    }

    const result = await this.authService.logout(token, refreshToken);
    return res.status(StatusCodes.OK).json(result);
  });
}