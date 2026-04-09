import { Router } from 'express';
import { AuthController } from '@module/auth/auth.controller';
import { authenticate } from '@middlewares/auth.middleware';
import { requireRefreshToken } from '@middlewares/authRefresh.middleware';

const router = Router();
const authController = new AuthController();

// refresh toke
router.get('/refresh-token', requireRefreshToken, authController.refresh.bind(authController));
// login and register password
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/verify-otp', authController.verifyRegister.bind(authController));
// reset password
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/verify-reset-otp', authController.verifyResetOtp.bind(authController));

router.patch('/reset-password', authenticate, authController.resetPassword.bind(authController));
// logout
router.post('/logout', authenticate, authController.logout.bind(authController));

export default router;