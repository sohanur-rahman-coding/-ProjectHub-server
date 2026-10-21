/**
 * ProjectHub Server Entry Point
 * Enables running with `nodemon index.js` or `node index.js`
 */
require('dotenv/config');

// Register tsx runtime compiler for TypeScript files
try {
  require('tsx/cjs');
} catch (e) {
  console.warn('[Warning] tsx/cjs could not be loaded directly:', e.message);
}

// Load and bootstrap the Express application
require('./src/server.ts');
