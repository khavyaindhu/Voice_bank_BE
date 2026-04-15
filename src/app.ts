import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : allowedOrigin,
  credentials: allowedOrigin !== '*',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP',
});
app.use('/api', limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'VoiceBank API' }));

app.use('/api', routes);

app.use(errorHandler);

export default app;
