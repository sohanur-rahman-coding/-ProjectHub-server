import { z } from 'zod';
import { SubmissionStatus } from '@prisma/client';

export const createSubmissionSchema = z.object({
  projectName: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name cannot exceed 100 characters'),
  repoUrl: z
    .string()
    .url('Please provide a valid Git repository URL')
    .refine(
      (val) => val.includes('github.com') || val.includes('gitlab.com') || val.includes('bitbucket.org'),
      'Repository URL should point to a valid GitHub, GitLab, or Bitbucket repository',
    ),
  liveUrl: z
    .string()
    .url('Please provide a valid live demo URL')
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), 'URL must include http:// or https://'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters explaining features and tech stack')
    .max(2000, 'Description cannot exceed 2000 characters'),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum([SubmissionStatus.APPROVED, SubmissionStatus.REJECTED, SubmissionStatus.PENDING]),
  feedback: z.string().max(1000, 'Feedback cannot exceed 1000 characters').optional().nullable(),
});

export const getSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(8),
  status: z.enum(['ALL', SubmissionStatus.PENDING, SubmissionStatus.APPROVED, SubmissionStatus.REJECTED]).default('ALL'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'projectName', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
export type GetSubmissionsQuery = z.infer<typeof getSubmissionsQuerySchema>;
