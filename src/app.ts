import express, { Application, Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import planRoutes from './routes/plan.routes';
import subscriptionRoutes from './routes/subscription.routes';
import { errorHandler } from './middleware/error.middleware';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

app.use(errorHandler);

export default app;
