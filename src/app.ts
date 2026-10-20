import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import authRoutes from './routes/auth.routes';
import submissionRoutes from './routes/submission.routes';
import reviewRoutes from './routes/review.routes';
import { errorHandler } from './middleware/errorHandler';

const app: Application = express();

// Trust proxy for rate limiting behind reverse proxies/Vercel
app.set('trust proxy', 1);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost or standard client origins
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Project Submission & Review Dashboard API is live',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      submissions: '/api/submissions',
      reviews: '/api/reviews',
    },
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
