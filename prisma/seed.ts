import { PrismaClient, Role, SubmissionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data for idempotency
  await prisma.projectSubmission.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 1. Seed Admin directly in database (per task specification)
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: defaultPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`Created Admin: ${admin.email} (Password: Password@123)`);

  // 2. Seed Mentor
  const mentor = await prisma.user.create({
    data: {
      name: 'Senior Mentor Alex',
      email: 'mentor@example.com',
      password: defaultPasswordHash,
      role: Role.MENTOR,
    },
  });
  console.log(`Created Mentor: ${mentor.email} (Password: Password@123)`);

  // 2. Seed Students
  const student1 = await prisma.user.create({
    data: {
      name: 'Rahim Chowdhury',
      email: 'student@example.com',
      password: defaultPasswordHash,
      role: Role.STUDENT,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Sadia Islam',
      email: 'sadia@example.com',
      password: defaultPasswordHash,
      role: Role.STUDENT,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Tanvir Ahmed',
      email: 'tanvir@example.com',
      password: defaultPasswordHash,
      role: Role.STUDENT,
    },
  });

  console.log('Created Students: student@example.com, sadia@example.com, tanvir@example.com (Password: Password@123)');

  // 3. Seed Realistic Project Submissions
  const submissions = [
    {
      projectName: 'DevPulse - Developer Analytics Platform',
      repoUrl: 'https://github.com/rahim-ch/devpulse-analytics',
      liveUrl: 'https://devpulse-demo.vercel.app',
      description: 'A comprehensive analytics dashboard for engineering teams to track commit velocity, PR review times, and deployment health metrics using Next.js and TailwindCSS.',
      status: SubmissionStatus.APPROVED,
      reviewFeedback: 'Outstanding work! Clean component architecture, solid TypeScript types, and intuitive visualizations.',
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      studentId: student1.id,
      reviewedById: mentor.id,
    },
    {
      projectName: 'CareSync - Healthcare Booking Portal',
      repoUrl: 'https://github.com/rahim-ch/caresync-portal',
      liveUrl: 'https://caresync-health.vercel.app',
      description: 'Patient-doctor consultation management system featuring appointment scheduling, automated calendar invites, and encrypted medical records storage.',
      status: SubmissionStatus.PENDING,
      studentId: student1.id,
    },
    {
      projectName: 'QuickMart - Multi-Vendor Marketplace',
      repoUrl: 'https://github.com/sadia-dev/quickmart-ecom',
      liveUrl: 'https://quickmart-live.netlify.app',
      description: 'Modern eCommerce platform supporting multi-vendor stores, Stripe payments, automated invoice PDF generation, and real-time inventory management.',
      status: SubmissionStatus.APPROVED,
      reviewFeedback: 'Great execution on the checkout flow and state management. Meets all assignment criteria.',
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      studentId: student2.id,
      reviewedById: mentor.id,
    },
    {
      projectName: 'CodeSnippet Cloud - Developer Pastebin',
      repoUrl: 'https://github.com/sadia-dev/codesnippet-cloud',
      liveUrl: 'https://codesnippet-invalid-link.example.com',
      description: 'Instant code sharing platform with syntax highlighting for 40+ programming languages and expiring secret URLs.',
      status: SubmissionStatus.REJECTED,
      reviewFeedback: 'The live demo link is unreachable (404 Not Found), and unit tests are failing in the repository. Please fix and resubmit.',
      reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      studentId: student2.id,
      reviewedById: mentor.id,
    },
    {
      projectName: 'TaskFlow - Collaborative Agile Board',
      repoUrl: 'https://github.com/tanvir-ahmed/taskflow-kanban',
      liveUrl: 'https://taskflow-kanban.vercel.app',
      description: 'Kanban board application with drag-and-drop task reordering, team workspaces, activity audit logs, and dark mode support.',
      status: SubmissionStatus.PENDING,
      studentId: student3.id,
    },
    {
      projectName: 'EventSphere - Conference Management',
      repoUrl: 'https://github.com/tanvir-ahmed/eventsphere-hub',
      liveUrl: 'https://eventsphere-demo.vercel.app',
      description: 'End-to-end event ticketing, speaker profile directory, and interactive session schedule builder for tech conferences.',
      status: SubmissionStatus.PENDING,
      studentId: student3.id,
    },
  ];

  for (const sub of submissions) {
    await prisma.projectSubmission.create({ data: sub });
  }

  console.log(`Seeded ${submissions.length} project submissions across various statuses.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
