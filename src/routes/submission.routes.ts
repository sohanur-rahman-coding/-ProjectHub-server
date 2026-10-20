import { Router } from 'express';
import { Role } from '@prisma/client';
import { createSubmission, getMySubmissions } from '../controllers/submission.controller';
import { authenticateJwt, requireRole } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import { createSubmissionSchema } from '../schemas/submission.schema';
import { submissionRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Student submission routes
router.use(authenticateJwt);
router.use(requireRole(Role.STUDENT, Role.ADMIN));

router.post('/', submissionRateLimiter, validateBody(createSubmissionSchema), createSubmission);
router.get('/my', getMySubmissions);

export default router;
