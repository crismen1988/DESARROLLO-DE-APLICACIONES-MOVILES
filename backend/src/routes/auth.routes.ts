import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { asyncRoute } from './async';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', asyncRoute(AuthController.register));
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', asyncRoute(AuthController.resetPassword));
router.post('/biometric', AuthController.biometricAuth);

export default router;
