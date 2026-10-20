import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { CreateSubmissionInput } from '../schemas/submission.schema';

export const createSubmission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const { projectName, repoUrl, liveUrl, description }: CreateSubmissionInput = req.body;

    const normalizedRepo = repoUrl.trim().toLowerCase().replace(/\/$/, '');
    const trimmedProjectName = projectName.trim();

    // Duplicate Prevention 1: Check if this repository URL was already submitted by the student
    const existingRepo = await prisma.projectSubmission.findFirst({
      where: {
        studentId,
        repoUrl: {
          equals: normalizedRepo,
          mode: 'insensitive',
        },
      },
    });

    if (existingRepo) {
      res.status(409).json({
        success: false,
        message: 'Duplicate submission: You have already submitted a project with this repository URL.',
        data: {
          existingSubmissionId: existingRepo.id,
          existingProjectName: existingRepo.projectName,
          status: existingRepo.status,
        },
      });
      return;
    }

    // Duplicate Prevention 2: Check if this student already submitted a project with identical title
    const existingName = await prisma.projectSubmission.findFirst({
      where: {
        studentId,
        projectName: {
          equals: trimmedProjectName,
          mode: 'insensitive',
        },
      },
    });

    if (existingName) {
      res.status(409).json({
        success: false,
        message: 'Duplicate submission: You already have a submission with this exact project name.',
      });
      return;
    }

    const newSubmission = await prisma.projectSubmission.create({
      data: {
        projectName: trimmedProjectName,
        repoUrl: normalizedRepo,
        liveUrl: liveUrl.trim(),
        description: description.trim(),
        studentId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project submitted successfully for mentor review!',
      data: {
        submission: newSubmission,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySubmissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = req.user!.userId;

    const submissions = await prisma.projectSubmission.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
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
      data: {
        submissions,
      },
    });
  } catch (error) {
    next(error);
  }
};
