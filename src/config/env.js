import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/akatsukis-draft',
  jwtSecret: process.env.JWT_SECRET || 'akatsuki_development_secret_key_change_in_production_123!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  frontendUrl: process.env.FRONTEND_URL || '*',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminName: process.env.ADMIN_NAME || 'Platform Administrator'
};

export const validateEnv = () => {
  if (config.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
    }
    if (!process.env.MONGODB_URI) {
      throw new Error('FATAL: MONGODB_URI environment variable is required in production.');
    }
  }
};
