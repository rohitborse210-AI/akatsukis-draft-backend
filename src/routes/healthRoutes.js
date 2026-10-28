import { Router } from 'express';
import mongoose from 'mongoose';
import { isDbConnected } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/health', (req, res) => {
  const connected = isDbConnected();
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const stateString = dbStates[mongoose.connection.readyState] || 'unknown';

  return sendSuccess(res, 'System health status.', {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected,
      state: stateString,
    },
  });
});

export default router;
