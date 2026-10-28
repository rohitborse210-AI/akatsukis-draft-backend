import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: config.nodeEnv === 'production',
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.frontendUrl === '*' || config.frontendUrl.split(',').includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin '${origin}' not allowed.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsing with safe size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global rate limiting
app.use(generalLimiter);

// Register routes at both root and /api prefixes for full Postman and client compatibility
const registerApiEndpoints = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/posts`, postRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}`, healthRoutes);
};

registerApiEndpoints('');
registerApiEndpoints('/api');

// Welcome / Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: "Akatsuki's Draft API",
    version: '1.0.0',
    description: 'AI-Enabled Content Sharing Platform Backend for Nodevember 4.0',
    documentation: '/api/health',
  });
});

// 404 Route Not Found handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
