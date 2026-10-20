import { Response, NextFunction } from 'express';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { GetSubmissionsQuery, UpdateReviewStatusInput } from '../schemas/submission.schema';

export const getReviewSubmissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query as unknown as GetSubmissionsQuery;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 8));
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectSubmissionWhereInput = {};

    // Server-side filter by status
    if (query.status && query.status !== 'ALL') {
      where.status = query.status as SubmissionStatus;
    }

    // Server-side search filter
    if (query.search && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      where.OR = [
        { projectName: { contains: searchTerm, mode: 'insensitive' } },
        { student: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { student: { email: { contains: searchTerm, mode: 'insensitive' } } },
        { repoUrl: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProjectSubmissionOrderByWithRelationInput = {
      [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
    };

    const [total, submissions] = await Promise.all([
      prisma.projectSubmission.count({ where }),
      prisma.projectSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubmissionReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const mentorId = req.user!.userId;
    const { id } = req.params;
    const { status, feedback }: UpdateReviewStatusInput = req.body;

    const existingSubmission = await prisma.projectSubmission.findUnique({
      where: { id },
      include: { student: { select: { name: true, email: true } } },
    });

    if (!existingSubmission) {
      res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
      return;
    }

    const updated = await prisma.projectSubmission.update({
      where: { id },
      data: {
        status,
        reviewFeedback: feedback ? feedback.trim() : null,
        reviewedAt: new Date(),
        reviewedById: mentorId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Project marked as ${status}`,
      data: {
        submission: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAggregatedStats = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.projectSubmission.count(),
      prisma.projectSubmission.count({ where: { status: SubmissionStatus.PENDING } }),
      prisma.projectSubmission.count({ where: { status: SubmissionStatus.APPROVED } }),
      prisma.projectSubmission.count({ where: { status: SubmissionStatus.REJECTED } }),
    ]);

    const reviewedCount = approved + rejected;
    const approvalRate = reviewedCount > 0 ? Math.round((approved / reviewedCount) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalSubmissions: total,
          totalPending: pending,
          totalApproved: approved,
          totalRejected: rejected,
          approvalRate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
