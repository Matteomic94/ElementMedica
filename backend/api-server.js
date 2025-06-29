import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { google } from 'googleapis';
import fs from 'fs';
import { mkdirp } from 'mkdirp';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import googleApiService from './utils/googleApiService.js';
import { createOptimizedPrismaClient, gracefulShutdown } from './config/prisma-optimization.js';
import { RedisService } from './config/redis-config.js';
import { 
  requestPerformanceMiddleware, 
  databasePerformanceMiddleware,
  getPerformanceDashboard,
  startPerformanceMonitoring
} from './middleware/performance-monitor.js';

// Import authentication
import { createAuthRouter, initializeAuth, shutdownAuth } from './auth/index.js';
import middleware from './auth/middleware.js';

// Import route modules
import coursesRoutes from './routes/courses-routes.js';
import usersRoutes from './routes/users-routes.js';
import companiesRoutes from './routes/companies-routes.js';
import personRoutes from './routes/person-routes.js';
import employeesRoutes from './routes/employees-routes.js';
import schedulesRoutes from './routes/schedules-routes.js';

// Import v1 routes
import authV1Routes from './routes/v1/auth.js';

// Import logging and error handling
import { logger, httpLogger } from './utils/logger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

const { authenticate: authenticateToken, authorize: requirePermission, requireSameCompany: requireCompanyAccess } = middleware;

dotenv.config({ path: './.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma Client with optimizations
const prisma = createOptimizedPrismaClient();

// Add performance monitoring middleware to Prisma - TEMPORARILY DISABLED FOR TIMEOUT DEBUG
// prisma.$use(databasePerformanceMiddleware.query);

// Initialize Redis Service
const redisService = new RedisService();

// Aggiungiamo middleware per conversione automatica dei tipi numerici
prisma.$use(async (params, next) => {
  // Solo per operazioni Course
  if (params.model === 'Course') {
    // Converti i tipi nelle operazioni di creazione e aggiornamento
    if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
      const data = params.args.data;
      
      if (data) {
        try {
          // Funzione helper per convertire campi numerici
          const convertNumericField = (value, isInteger = false) => {
            if (value === null || value === '' || value === undefined) return null;
            const num = Number(value);
            if (isNaN(num)) return null;
            return isInteger ? Math.round(num) : num;
          };
          
          // Converti i campi numerici
          if ('validityYears' in data) {
            data.validityYears = convertNumericField(data.validityYears, true);
          }
          
          if ('maxPeople' in data) {
            data.maxPeople = convertNumericField(data.maxPeople, true);
          }
          
          if ('pricePerPerson' in data) {
            data.pricePerPerson = convertNumericField(data.pricePerPerson, false);
          }
        } catch (e) {
          // Ignora gli errori e continua
        }
      }
    }
  }
  
  // Continua con l'operazione normale
  return next(params);
});

const app = express();

const PORT = 4001;

// Authentication system is initialized through route mounting
logger.info('Authentication system ready in API Server', { service: 'api-server', port: PORT });

// Configurazione CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// HTTP request logging
app.use(httpLogger);

// Performance monitoring middleware - TEMPORARILY DISABLED
// app.use(requestPerformanceMiddleware);

// Configurazione bodyParser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Mount v1 routes FIRST (more specific paths)
app.use('/api/v1/auth', authV1Routes);

// Mount authentication routes AFTER (more generic paths) - using different path to avoid conflicts
const authRoutes = createAuthRouter();
app.use('/api/legacy', authRoutes);

// Mount route modules
app.use('/api/persons', personRoutes); // New unified Person routes
app.use('/courses', coursesRoutes);
app.use('/users', usersRoutes);
app.use('/companies', companiesRoutes);
app.use('/employees', employeesRoutes); // Backward compatible
app.use('/schedules', schedulesRoutes);

// Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    mkdirp.sync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    const redisStatus = await redisService.healthCheck();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-server',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'connected',
        redis: redisStatus ? 'connected' : 'disconnected',
        googleApi: 'initialized'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Performance dashboard endpoint
app.get('/performance', getPerformanceDashboard);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// 404 handler (must be after all routes)
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize authentication system
    await initializeAuth();
    logger.info('✅ Authentication system initialized', { service: 'api-server' });
    
    // Initialize Google API Service
    await googleApiService.initialize();
    logger.info('✅ Google API Service initialized', { service: 'api-server' });
    
    // Initialize Redis service
    if (process.env.REDIS_ENABLED !== 'false') {
      await redisService.connect();
      logger.info('✅ Redis service connected', { service: 'api-server' });
    } else {
      logger.info('ℹ️ Redis disabled, running without cache', { service: 'api-server' });
    }
    
    // Start performance monitoring
    startPerformanceMonitoring();
    logger.info('✅ Performance monitoring started', { service: 'api-server' });
    
    // Start the server
    const server = app.listen(PORT, '127.0.0.1', () => {
      logger.info('🚀 API Server running successfully', {
        service: 'api-server',
        port: PORT,
        host: '127.0.0.1',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
      logger.info(`📈 Performance dashboard: http://127.0.0.1:${PORT}/performance`);
    });
    
    return server;
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Global server variable
let server;

// Initialize the server
startServer().then(serverInstance => {
  server = serverInstance;
}).catch(error => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Keep the process alive
process.stdin.resume();

// Graceful shutdown - Configurazione per development/production
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', async () => {
    logger.info('🔄 SIGTERM received, shutting down gracefully...', { service: 'api-server' });
    
    try {
      await googleApiService.shutdown();
      logger.info('✅ Google API Service shut down');
      
      await redisService.disconnect();
      logger.info('✅ Redis connection closed');
      
      if (server) {
        server.close(async () => {
          try {
            await shutdownAuth();
            await gracefulShutdown(prisma);
            logger.info('✅ API Server shutdown complete', { service: 'api-server' });
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during shutdown', { service: 'api-server', error: error.message, stack: error.stack });
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }
    } catch (error) {
      logger.error('❌ Error during shutdown', { service: 'api-server', error: error.message });
      process.exit(1);
    }
  });

  process.on('SIGINT', async () => {
    logger.info('🔄 SIGINT received, shutting down gracefully...', { service: 'api-server' });
    
    try {
      await googleApiService.shutdown();
      logger.info('✅ Google API Service shut down');
      
      await redisService.disconnect();
      logger.info('✅ Redis connection closed');
      
      if (server) {
        server.close(async () => {
          try {
            await shutdownAuth();
            await gracefulShutdown(prisma);
            logger.info('✅ API Server shutdown complete', { service: 'api-server' });
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during shutdown', { service: 'api-server', error: error.message, stack: error.stack });
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }
    } catch (error) {
      logger.error('❌ Error during shutdown', { service: 'api-server', error: error.message });
      process.exit(1);
    }
  });
} else {
  // Development mode: Ignora completamente i segnali SIGINT/SIGTERM
  process.on('SIGTERM', () => {
    logger.info('🔧 SIGTERM ignored in development mode', { service: 'api-server' });
  });
  
  process.on('SIGINT', () => {
    logger.info('🔧 SIGINT ignored in development mode', { service: 'api-server' });
  });
  
  logger.info('🔧 Development mode: SIGINT/SIGTERM signals will be ignored to prevent automatic shutdowns', { service: 'api-server' });
}

export default app;