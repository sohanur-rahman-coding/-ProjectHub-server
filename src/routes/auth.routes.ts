import { Router } from 'express';
import { register, login, getMe, googleAuth } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/google', authRateLimiter, googleAuth);
router.get('/me', authenticateJwt, getMe);

export default router;
