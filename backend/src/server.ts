import app from './app';
import { config } from './config/env';
import { prisma } from './config/db';

const PORT = Number(process.env.PORT) || config.port || 10000;

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('Database connected successfully');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`PMS Server running on 0.0.0.0:${PORT}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received: closing HTTP server...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
