/**
 * ProjectHub Server Entry Point
 * Supports both standalone execution (`nodemon index.js` / `node index.js`)
 * and Vercel Serverless Function exports (`@vercel/node`).
 */
require('dotenv/config');

// Register tsx runtime compiler for TypeScript files
try {
  require('tsx/cjs');
} catch (e) {
  console.warn('[Warning] tsx/cjs could not be loaded directly:', e.message);
}

// Import Express application
const appModule = require('./src/app');
const app = appModule.default || appModule;

// If running outside Vercel serverless environment, start HTTP listener
if (!process.env.VERCEL) {
  require('./src/server.ts');
}

// Export app for Vercel serverless handler
module.exports = app;
