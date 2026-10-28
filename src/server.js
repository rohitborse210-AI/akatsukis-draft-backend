import app from './app.js';
import { config, validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { autoBootstrapAdmin } from './utils/bootstrap.js';

const startServer = async () => {
  try {
    validateEnv();

    // Establish MongoDB connection
    await connectDB();

    // Auto-bootstrap initial admin if credentials are provided in env
    await autoBootstrapAdmin();

    const server = app.listen(config.port, () => {
      console.log(`=================================================`);
      console.log(`  Akatsuki's Draft Backend Server is running!    `);
      console.log(`  Port:        http://localhost:${config.port}     `);
      console.log(`  Environment: ${config.nodeEnv}                  `);
      console.log(`  Health:      http://localhost:${config.port}/health`);
      console.log(`=================================================`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await disconnectDB();
          console.log('[Database] MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('[Database] Error during disconnect:', err.message);
          process.exit(1);
        }
      });

      // Force exit if not completed within 10s
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    return server;
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
