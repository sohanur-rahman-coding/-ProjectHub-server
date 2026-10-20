import app from './app';
import { ENV } from './config/env';
import { ensurePostgresRunning, stopEmbeddedPostgres } from './db/embedded';
import { prisma } from './config/prisma';

async function bootstrap() {
  try {
    // 1. Ensure PostgreSQL is up (using embedded-postgres on port 5433 if external PG not active)
    await ensurePostgresRunning(ENV.EMBEDDED_PG_PORT);

    // 2. Test database connection
    await prisma.$connect();
    console.log('[Prisma] Connected to PostgreSQL database successfully.');

    // 3. Start Express HTTP server
    const server = app.listen(ENV.PORT, () => {
      console.log(`\n======================================================`);
      console.log(` Project Review & Submission API Server`);
      console.log(` Running on: http://localhost:${ENV.PORT}`);
      console.log(` Environment: ${ENV.NODE_ENV}`);
      console.log(` Client URL: ${ENV.CLIENT_URL}`);
      console.log(` Database: PostgreSQL via Prisma ORM`);
      console.log(`======================================================\n`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully closing server...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await prisma.$disconnect();
        console.log('[Prisma] Database disconnected.');
        await stopEmbeddedPostgres();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('[Bootstrap Error] Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
