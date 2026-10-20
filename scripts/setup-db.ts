import { execSync } from 'child_process';
import { ensurePostgresRunning } from '../src/db/embedded';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const port = parseInt(process.env.EMBEDDED_PG_PORT || '5433', 10);
  console.log('--- Setting up PostgreSQL Database ---');
  await ensurePostgresRunning(port);

  console.log('[Prisma] Pushing schema to PostgreSQL...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

  console.log('[Prisma] Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('[Prisma] Seeding initial data (Admin/Mentor, Students, Projects)...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });

  console.log('--- Database Setup Completed Successfully! ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
