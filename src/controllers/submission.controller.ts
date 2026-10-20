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

    // Duplicate Prevention 1: Check if this repository URL was already submitted (by you or another student)
    const existingRepo = await prisma.projectSubmission.findFirst({
      where: {
        repoUrl: {
          equals: normalizedRepo,
          mode: 'insensitive',
        },
      },
    });

    if (existingRepo) {
      const isSelf = existingRepo.studentId === studentId;
      res.status(409).json({
        success: false,
        message: isSelf
          ? 'Duplicate submission: You have already submitted a project with this repository URL.'
          : 'Duplicate submission: This repository URL has already been submitted by another student.',
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

export const updateSubmission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const studentId = req.user!.userId;
    const { id } = req.params;
    const { projectName, repoUrl, liveUrl, description }: CreateSubmissionInput = req.body;

    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Project submission not found' });
      return;
    }

    // Permission check: only student who owns it (or ADMIN)
    if (submission.studentId !== studentId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You do not have permission to update this submission' });
      return;
    }

    const normalizedRepo = repoUrl.trim().toLowerCase().replace(/\/$/, '');
    const trimmedProjectName = projectName.trim();

    // Check duplicate repo URL against other submissions
    const existingRepo = await prisma.projectSubmission.findFirst({
      where: {
        id: { not: id },
        repoUrl: { equals: normalizedRepo, mode: 'insensitive' },
      },
    });

    if (existingRepo) {
      res.status(409).json({
        success: false,
        message: 'Duplicate submission: This repository URL is already used by another project.',
      });
      return;
    }

    const updated = await prisma.projectSubmission.update({
      where: { id },
      data: {
        projectName: trimmedProjectName,
        repoUrl: normalizedRepo,
        liveUrl: liveUrl.trim(),
        description: description.trim(),
        status: submission.status === 'REJECTED' ? 'PENDING' : submission.status,
      },
      include: {
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Project submission updated successfully!',
      data: {
        submission: updated,
      },
    });
  } catch (error) {
    next(error);
  }
};
