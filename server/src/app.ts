import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Mount API Router under /api
  app.use('/api', apiRouter);

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  return app;
};
