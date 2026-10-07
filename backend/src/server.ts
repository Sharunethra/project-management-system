import app from './app';
import { config } from './config/env';
import { prisma } from './config/db';

const PORT = config.port;

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PMS Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
