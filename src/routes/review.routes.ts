import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  getReviewSubmissions,
  updateSubmissionReview,
  getAggregatedStats,
} from '../controllers/review.controller';
import { authenticateJwt, requireRole } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate';
import { getSubmissionsQuerySchema, updateReviewStatusSchema } from '../schemas/submission.schema';

const router = Router();

// Mentor and Admin only review routes
router.use(authenticateJwt);
router.use(requireRole(Role.MENTOR, Role.ADMIN));

router.get('/stats', getAggregatedStats);
router.get('/submissions', validateQuery(getSubmissionsQuerySchema), getReviewSubmissions);
router.patch('/submissions/:id', validateBody(updateReviewStatusSchema), updateSubmissionReview);

export default router;
