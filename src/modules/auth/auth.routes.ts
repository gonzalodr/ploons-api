import { Router } from 'express';
import { AuthController } from '@module/auth/auth.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { validateRefreshToken } from '@middlewares/authRefresh.middleware';

const router = Router();
const authController = new AuthController();

// Auth principal
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/verify-otp', authController.verifyRegister.bind(authController));

// Refresh token (POST, no GET)
router.post('/refresh', validateRefreshToken, authController.refresh.bind(authController));

// Reset password
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/verify-reset-otp', authController.verifyResetOtp.bind(authController));
router.patch('/reset-password', authenticate, validateRefreshToken, authController.resetPassword.bind(authController));

// Logout (con refresh token obligatorio)
router.post('/logout', authenticate, validateRefreshToken, authController.logout.bind(authController));

export default router;