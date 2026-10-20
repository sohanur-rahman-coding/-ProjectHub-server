import path from 'path';
import net from 'net';

// Helper to check if a port is currently listening
export function isPortInUse(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

let pgInstance: any = null;

export async function ensurePostgresRunning(port = 5433): Promise<void> {
  const inUse = await isPortInUse(port);
  if (inUse) {
    console.log(`[Database] PostgreSQL is already running on port ${port}.`);
    return;
  }

  console.log(`[Database] Starting Embedded PostgreSQL server on port ${port}...`);
  // Dynamically import embedded-postgres
  const EmbeddedPostgresModule = await import('embedded-postgres');
  const EmbeddedPostgres = (EmbeddedPostgresModule as any).default?.default || (EmbeddedPostgresModule as any).default || EmbeddedPostgresModule;

  const dataDir = path.resolve(process.cwd(), '.pg-data');

  pgInstance = new EmbeddedPostgres({
    port,
    user: 'postgres',
    password: 'password',
    databaseDir: dataDir,
    persistent: true,
  });

  try {
    await pgInstance.initialise();
  } catch (err: any) {
    // Already initialized or exists
    if (!err?.message?.includes('already exists')) {
      // ignore normal already-initialized warnings
    }
  }

  await pgInstance.start();
  console.log(`[Database] Embedded PostgreSQL server started successfully on port ${port}!`);

  const shutdown = async () => {
    if (pgInstance) {
      console.log('\n[Database] Stopping Embedded PostgreSQL...');
      try {
        await pgInstance.stop();
        console.log('[Database] Embedded PostgreSQL stopped.');
      } catch (e) {
        // quiet exit
      }
    }
  };

  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });
}

export async function stopEmbeddedPostgres(): Promise<void> {
  if (pgInstance) {
    try {
      await pgInstance.stop();
    } catch (e) {
      // quiet
    }
    pgInstance = null;
  }
}
