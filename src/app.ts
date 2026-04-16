import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.set('trust proxy', 1);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';

// Dynamic CORS: allow exact FRONTEND_URL, all GitHub Codespace origins,
// and localhost for local dev — no need to update env var on every restart.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser / curl
    if (
      origin === allowedOrigin ||
      /^https:\/\/[a-z0-9-]+-4200\.app\.github\.dev$/.test(origin) ||
      /^http:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
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
