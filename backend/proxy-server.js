import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import { createServer } from 'node:http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { initializeAuth, shutdownAuth } from './auth/index.js';
import middleware from './auth/middleware.js';
const { authenticate: authenticateToken, authorize: requirePermission, requireSameCompany: requireCompanyAccess } = middleware;
// authRoutes rimosso - non necessario nel proxy server
import { createOptimizedPrismaClient } from './config/prisma-optimization.js';

// Import logging and error handling
import { logger, httpLogger, logAudit } from './utils/logger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import loadBalancer from './utils/loadBalancer.js';

// Initialize Prisma client
// Inizializzazione Prisma con gestione errori
let prisma;
try {
  prisma = createOptimizedPrismaClient();
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  throw new Error('Database connection failed');
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || process.env.PORT || 4006;

console.log('🔧 Environment variables loaded:');
console.log('   PROXY_PORT:', process.env.PROXY_PORT);
console.log('   Using PORT:', PORT);

// CORS configuration - MUST be first middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Gestione degli errori di avvio
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  logger.error('Uncaught Exception', { service: 'proxy-server', error: error.message, stack: error.stack });
  process.exit(1);
});

// Gestione degli errori nelle promise non gestite
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { service: 'proxy-server', reason, promise });
  process.exit(1);
});

// Async initialization function
async function initializeServer() {
  try {
    // Initialize authentication system
    await initializeAuth();
    logger.info('Authentication system initialized in Proxy Server', { service: 'proxy-server', port: PORT });

    // Rate limiting configuration
    const generalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          service: 'proxy-server',
          ip: req.ip,
          path: req.path,
          userAgent: req.get('User-Agent')
        });
        res.status(429).json({
          error: 'Too many requests from this IP',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: '15 minutes'
        });
      }
    });

    // Stricter rate limiting for API endpoints
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // Limit each IP to 50 API requests per windowMs
      message: {
        error: 'Too many API requests from this IP',
        code: 'API_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn('API rate limit exceeded', {
          service: 'proxy-server',
          ip: req.ip,
          path: req.path,
          userAgent: req.get('User-Agent')
        });
        res.status(429).json({
          error: 'Too many API requests from this IP',
          code: 'API_RATE_LIMIT_EXCEEDED',
          retryAfter: '15 minutes'
        });
      }
    });

    // Debug middleware removed - proxy working correctly

    // Middleware di sicurezza
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https:"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:"],
        },
      },
    }));

    // HTTP request logging
    app.use(httpLogger);
    
    // DEBUG: Middleware per tracciare modifiche al path
    app.use((req, res, next) => {
      console.log('🔍 [PATH TRACE] Original:', {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
      });
      next();
    });

    // Apply general rate limiting to all requests
    app.use(generalLimiter);

    // Configurazione dei target per i server
    const apiServerTarget = 'http://127.0.0.1:4001';
    const documentsServerTarget = 'http://127.0.0.1:4002';

    // Register servers with load balancer
    loadBalancer.registerServer('api-primary', {
      url: 'http://127.0.0.1:4001',
      weight: 1,
      type: 'api'
    });

    loadBalancer.registerServer('documents-primary', {
      url: 'http://127.0.0.1:4002',
      weight: 1,
      type: 'documents'
    });

    // Start health checks
    loadBalancer.startHealthChecks();

    // Configurazione per le chiamate API dirette
    const API_PORT = 4001;
    const API_HOST = '127.0.0.1';
    const API_URL = `http://${API_HOST}:${API_PORT}`;

    // Middleware per il logging delle richieste
    app.use((req, res, next) => {
      // Rimuoviamo il logging per migliorare le prestazioni
      next();
    });

    // CRITICAL FIX: Body parser RIMOSSO globalmente perché interferisce con http-proxy-middleware
    // Il body parser consuma il body della richiesta e il proxy non può più accedervi
    // Verrà applicato solo agli endpoint locali che ne hanno bisogno
    // app.use(bodyParser.json({ limit: '50mb' }));
    // app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

    // Health check endpoint - MUST be before proxy middleware
    app.get('/health', async (req, res) => {
      try {
        // Check API server health
        const apiResponse = await axios.get(`${apiServerTarget}/health`, { timeout: 5000 });
        res.json(apiResponse.data);
      } catch (error) {
        logger.error('Health check failed', { service: 'proxy-server', error: error.message });
        res.status(503).json({
          status: 'unhealthy',
          error: 'API server not responding',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Le richieste /auth vengono gestite dal middleware /api generale
    
    // Routing locale per courses (gestito direttamente dal proxy)
    app.get('/courses', async (req, res) => {
      const { search } = req.query;
      let where = {};
      if (search) {
        where = {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        };
      }
      const courses = await prisma.course.findMany({ where });
      res.json(courses);
    });

    app.get('/courses/:id', async (req, res) => {
      const course = await prisma.course.findUnique({ where: { id: req.params.id } });
      if (!course) return res.status(404).json({ error: 'Not found' });
      res.json(course);
    });

    app.post('/courses', bodyParser.json({ limit: '50mb' }), bodyParser.urlencoded({ extended: true, limit: '50mb' }), async (req, res) => {
      try {
        const { price, ...inputData } = req.body;
        const sanitizedData = { ...inputData };
        
        if ('validityYears' in sanitizedData) {
          const num = Number(sanitizedData.validityYears);
          sanitizedData.validityYears = !isNaN(num) ? Math.round(num) : null;
        }
        
        if ('maxPeople' in sanitizedData) {
          const num = Number(sanitizedData.maxPeople);
          sanitizedData.maxPeople = !isNaN(num) ? Math.round(num) : null;
        }
        
        if ('pricePerPerson' in sanitizedData) {
          const num = Number(sanitizedData.pricePerPerson);
          sanitizedData.pricePerPerson = !isNaN(num) ? num : null;
        }

        let course;
        if (sanitizedData.code) {
          course = await prisma.course.upsert({
            where: { code: sanitizedData.code },
            update: sanitizedData,
            create: sanitizedData
          });
        } else {
          course = await prisma.course.create({ data: sanitizedData });
        }

        res.status(201).json(course);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.put('/courses/:id', bodyParser.json({ limit: '50mb' }), bodyParser.urlencoded({ extended: true, limit: '50mb' }), async (req, res) => {
      try {
        const { price, ...inputData } = req.body;
        const sanitizedData = { ...inputData };
        
        if ('validityYears' in sanitizedData) {
          const num = Number(sanitizedData.validityYears);
          sanitizedData.validityYears = !isNaN(num) ? Math.round(num) : null;
        }
        
        if ('maxPeople' in sanitizedData) {
          const num = Number(sanitizedData.maxPeople);
          sanitizedData.maxPeople = !isNaN(num) ? Math.round(num) : null;
        }
        
        if ('pricePerPerson' in sanitizedData) {
          const num = Number(sanitizedData.pricePerPerson);
          sanitizedData.pricePerPerson = !isNaN(num) ? num : null;
        }
        
        const course = await prisma.course.update({
          where: { id: req.params.id },
          data: sanitizedData
        });

        res.json(course);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/courses/:id', async (req, res) => {
      await prisma.course.delete({ where: { id: req.params.id } });
      res.status(204).end();
    });

    // Bulk import dei corsi
    app.post('/courses/bulk-import', bodyParser.json({ limit: '50mb' }), bodyParser.urlencoded({ extended: true, limit: '50mb' }), async (req, res) => {
      try {
        if (!Array.isArray(req.body)) {
          return res.status(400).json({ error: 'Expected an array of courses' });
        }
        
        const courses = req.body;
        const results = { success: [], errors: [] };
        
        const sanitizeCourse = (course) => {
          const { id, price, ...data } = course;
          
          if (data.validityYears !== undefined) {
            const num = Number(data.validityYears);
            data.validityYears = !isNaN(num) ? Math.round(num) : null;
          }
          
          if (data.maxPeople !== undefined) {
            const num = Number(data.maxPeople);
            data.maxPeople = !isNaN(num) ? Math.round(num) : null;
          }
          
          if (data.pricePerPerson !== undefined) {
            const num = Number(data.pricePerPerson);
            data.pricePerPerson = !isNaN(num) ? num : null;
          }
          
          return data;
        };
        
        for (const course of courses) {
          try {
            const cleanedData = sanitizeCourse(course);
            let result;
            
            if (cleanedData.code) {
              result = await prisma.course.upsert({
                where: { code: cleanedData.code },
                update: cleanedData,
                create: cleanedData
              });
            } else {
              result = await prisma.course.create({ data: cleanedData });
            }
            
            results.success.push(result);
          } catch (err) {
            results.errors.push({ course, error: err.message });
          }
        }
        
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Endpoint per schedules con attestati
     app.get('/schedules-with-attestati', async (req, res) => {
       try {
         const schedules = await prisma.courseSchedule.findMany({
           include: {
             course: true,
             sessions: true,
             companies: { include: { company: true } },
             enrollments: { include: { employee: true } },
           },
           orderBy: { start_date: 'asc' },
         });
         
         const attestati = await prisma.attestato.findMany({});
         const attestatiBySchedule = new Set(attestati.map(a => a.scheduledCourseId));
         const result = schedules.map(s => ({
           ...s,
           hasAttestati: attestatiBySchedule.has(s.id)
         }));
         res.json(result);
       } catch (err) {
         res.status(500).json({ error: err.message });
       }
     });

     // Endpoint per ottenere lista template
     app.get('/templates', 
       authenticateToken(), 
       requirePermission('documents:read'), 
       async (req, res) => {
       try {
         const userId = req.user.id;
         const userCompanyId = req.user.companyId;
         
         // Get templates from database that belong to user's company
         const companyTemplates = await prisma.templateLink.findMany({
           where: {
             eliminato: false,
             OR: [
               { companyId: req.user?.companyId },
               { isDefault: true },
               { companyId: null } // Global templates
             ]
           },
           select: {
             id: true,
             name: true,
             url: true,
             type: true,
             createdAt: true,
             updatedAt: true,
             fileFormat: true,
             isDefault: true
           },
           orderBy: {
             createdAt: 'desc'
           }
         });
         
         // Also get physical template files
         const templatesDir = path.join(process.cwd(), 'uploads', 'templates');
         let physicalTemplates = [];
         
         if (fs.existsSync(templatesDir)) {
           const files = fs.readdirSync(templatesDir);
           physicalTemplates = files.map(file => {
             const filePath = path.join(templatesDir, file);
             const stats = fs.statSync(filePath);
             return {
               name: file,
               size: stats.size,
               modified: stats.mtime,
               type: 'physical'
             };
           });
         }
         
         res.json({ 
           templates: companyTemplates,
           physicalTemplates,
           total: companyTemplates.length + physicalTemplates.length
         });
       } catch (error) {
         logger.error('Error listing templates', { service: 'proxy-server', error: error.message });
         res.status(500).json({ error: 'Internal server error' });
       }
     });

     // Endpoint per ottenere lista attestati
     app.get('/attestati', 
       authenticateToken(), 
       requirePermission('documents:read'), 
       async (req, res) => {
       try {
         const userId = req.user.id;
         const userCompanyId = req.user.companyId;
         
         // Get attestati from database that belong to user's company
         const companyAttestati = await prisma.attestato.findMany({
           where: {
             eliminato: false,
             partecipante: {
               companyId: userCompanyId
             }
           },
           include: {
             partecipante: {
               select: {
                 id: true,
                 first_name: true,
                 last_name: true,
                 email: true
               }
             },
             scheduledCourse: {
               select: {
                 id: true,
                 course: {
                   select: {
                     name: true,
                     code: true
                   }
                 }
               }
             }
           },
           orderBy: {
             dataGenerazione: 'desc'
           }
         });
         
         // Also check physical files and match with database records
         const attestatiDir = path.join(process.cwd(), 'uploads', 'attestati');
         let physicalFiles = [];
         
         if (fs.existsSync(attestatiDir)) {
           const files = fs.readdirSync(attestatiDir);
           physicalFiles = files.filter(file => {
             // Check if this file belongs to user's company by matching with database
             return companyAttestati.some(attestato => attestato.nomeFile === file);
           }).map(file => {
             const filePath = path.join(attestatiDir, file);
             const stats = fs.statSync(filePath);
             const dbRecord = companyAttestati.find(attestato => attestato.nomeFile === file);
             return {
               name: file,
               size: stats.size,
               modified: stats.mtime,
               participant: dbRecord?.partecipante,
               course: dbRecord?.scheduledCourse?.course
             };
           });
         }
         
         res.json({ 
           attestati: companyAttestati,
           physicalFiles,
           total: companyAttestati.length
         });
       } catch (error) {
         logger.error('Error listing attestati', { service: 'proxy-server', error: error.message });
         res.status(500).json({ error: 'Internal server error' });
       }
     });

    // Proxy middleware for trainers (direct to API server)
    app.use('/trainers', createProxyMiddleware({
      target: apiServerTarget,
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err, req, res) => {
        logger.error('Proxy error for trainers', { service: 'proxy-server', error: err.message, path: req.path });
        res.status(502).json({ error: 'Proxy error', message: err.message });
      },
      onProxyReq: (proxyReq, req, res) => {
        logger.debug('Proxying trainers request', { service: 'proxy-server', method: req.method, path: req.path });
      }
    }));

    // Proxy middleware for employees (direct to API server)
    app.use('/employees', createProxyMiddleware({
      target: apiServerTarget,
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err, req, res) => {
        logger.error('Proxy error for employees', { service: 'proxy-server', error: err.message, path: req.path });
        res.status(502).json({ error: 'Proxy error', message: err.message });
      },
      onProxyReq: (proxyReq, req, res) => {
        logger.debug('Proxying employees request', { service: 'proxy-server', method: req.method, path: req.path });
      }
    }));

    // CRITICAL: Auth middleware MUST be defined BEFORE the generic /api middleware
    // Proxy middleware for auth routes (must be BEFORE /api middleware to catch /api/v1/auth/*)
    
    app.use('/api/v1/auth', (req, res, next) => {
      console.log('🔍 DEBUG: /api/v1/auth middleware hit:', req.method, req.originalUrl, req.path);
      next();
    }, createProxyMiddleware({
      target: 'http://127.0.0.1:4001',
      changeOrigin: true,
      logLevel: 'debug',
      timeout: 30000,
      proxyTimeout: 30000,
      // Il server API monta le route auth su /api/v1/auth
      // Express rimuove /api/v1/auth dal path, lasciando solo il path relativo
      // Devo ricostruire il path completo per il server API
      pathRewrite: {
        '^/': '/api/v1/auth' // /login diventa /api/v1/auth/login
      },
      onError: (err, req, res) => {
          console.log('🔍 DEBUG: Proxy error occurred:', err.message);
          logger.error('Proxy error for auth', { 
            service: 'proxy-server', 
            error: err.message, 
            stack: err.stack,
            path: req.path, 
            url: req.url,
            originalUrl: req.originalUrl,
            method: req.method
          });
          if (!res.headersSent) {
            res.status(502).json({ error: 'Proxy error', message: err.message });
          }
        },
      onProxyReq: (proxyReq, req, res) => {
        logger.info('Proxying auth request', { 
          service: 'proxy-server', 
          method: req.method, 
          originalPath: req.path,
          originalUrl: req.url,
          targetPath: proxyReq.path,
          targetHost: proxyReq.getHeader('host'),
          targetUrl: `${proxyReq.protocol}//${proxyReq.getHeader('host')}${proxyReq.path}`
        });
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.info('Auth proxy response', { 
          service: 'proxy-server', 
          statusCode: proxyRes.statusCode, 
          originalPath: req.path,
          originalUrl: req.url
        });
      }
    }));

    // REMOVED: /api/v1/auth middleware - was causing path rewriting issues
    // The /v1/auth middleware with pathRewrite handles this correctly

    // V1 auth routes (for /v1/auth/*)
    console.log('🔍 DEBUG: Setting up proxy middleware for /v1/auth');
    console.log('🔧 Setting up /v1/auth middleware');
    
    // REMOVED: Duplicate /v1/auth middleware - was causing response duplication
    // The /api/v1/auth middleware above handles all auth routes correctly

    // Legacy auth routes (redirect to /api/auth)
    app.use('/auth', createProxyMiddleware({
      target: 'http://127.0.0.1:4001',
      changeOrigin: true,
      pathRewrite: {
        '^/auth': '/api/auth', // Redirect auth requests to API server
      },
      onError: (err, req, res) => {
        logger.error('Proxy error for legacy auth', { service: 'proxy-server', error: err.message, path: req.path, url: req.url });
        if (!res.headersSent) {
          res.status(502).json({ error: 'Proxy error', message: err.message });
        }
      }
    }));

    // Proxy middleware for specific API routes (excluding auth which is handled above)
    // Handle /api/tenant routes
    app.use('/api/tenant', apiLimiter, createProxyMiddleware({
      target: apiServerTarget,
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      pathRewrite: {
        '^/api/tenant': '/tenants', // Fix tenant vs tenants mismatch
      },
      onError: (err, req, res) => {
        logger.error('Proxy error for API tenant', { service: 'proxy-server', error: err.message, path: req.path });
        if (!res.headersSent) {
          res.status(502).json({ error: 'Proxy error', message: err.message });
        }
      }
    }));
    
    // Handle other /api routes (excluding auth and tenant)
    app.use('/api', (req, res, next) => {
      console.log('🔍 DEBUG: Generic /api middleware hit:', req.method, req.originalUrl, req.path);
      // Skip auth routes and tenant routes as they are handled by specific middleware above
      if (req.originalUrl.includes('/api/v1/auth') || req.path.startsWith('/v1/auth') || req.path.startsWith('/tenant')) {
        console.log('🔍 DEBUG: Skipping generic /api middleware for auth/tenant route');
        return next('route');
      }
      console.log('🔍 DEBUG: Proceeding with generic /api middleware');
      next();
    }, apiLimiter, createProxyMiddleware({
      target: apiServerTarget,
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      pathRewrite: {
        '^/api': '', // Remove /api prefix for remaining routes
      },
      onError: (err, req, res) => {
        logger.error('Proxy error for API', { service: 'proxy-server', error: err.message, path: req.path });
        if (!res.headersSent) {
          res.status(502).json({ error: 'Proxy error', message: err.message });
        }
      }
    }));

    // Proxy middleware for Documents routes
    app.use('/generate', createProxyMiddleware({
      target: documentsServerTarget,
      changeOrigin: true,
      timeout: 60000,
      proxyTimeout: 60000,
      onError: (err, req, res) => {
        logger.error('Proxy error for Documents', { service: 'proxy-server', error: err.message, path: req.path });
        res.status(502).json({ error: 'Proxy error', message: err.message });
      },
      onProxyReq: (proxyReq, req, res) => {
        logger.debug('Proxying Documents request', { service: 'proxy-server', method: req.method, path: req.path });
      }
    }));

    // Error handling middleware (must be last)
    app.use(notFoundHandler);
    app.use(globalErrorHandler);

    // Avvio del server proxy
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('Proxy Server started successfully', { service: 'proxy-server', port: PORT, host: '0.0.0.0', timestamp: new Date().toISOString() });
    });

    // Graceful shutdown - Configurazione per development/production
    if (process.env.NODE_ENV === 'production') {
      process.on('SIGTERM', () => {
        logger.info('SIGTERM received, shutting down gracefully', { service: 'proxy-server' });
        server.close(() => {
          try {
            loadBalancer.stopHealthChecks();
            shutdownAuth();
            logger.info('Proxy Server shutdown complete', { service: 'proxy-server' });
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown', { service: 'proxy-server', error: error.message, stack: error.stack });
            process.exit(1);
          }
        });
      });

      process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down gracefully', { service: 'proxy-server' });
        server.close(() => {
          try {
            loadBalancer.stopHealthChecks();
            shutdownAuth();
            logger.info('Proxy Server shutdown complete', { service: 'proxy-server' });
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown', { service: 'proxy-server', error: error.message, stack: error.stack });
            process.exit(1);
          }
        });
      });
    } else {
      // Development mode: Ignora completamente i segnali SIGINT/SIGTERM
      process.on('SIGTERM', () => {
        logger.info('🔧 SIGTERM ignored in development mode', { service: 'proxy-server' });
      });
      
      process.on('SIGINT', () => {
        logger.info('🔧 SIGINT ignored in development mode', { service: 'proxy-server' });
      });
      
      logger.info('🔧 Development mode: SIGINT/SIGTERM signals will be ignored to prevent automatic shutdowns', { service: 'proxy-server' });
    }

  } catch (error) {
    logger.error('Failed to initialize authentication system', { service: 'proxy-server', error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Initialize and start the server
initializeServer().catch((error) => {
  logger.error('Failed to initialize server', { service: 'proxy-server', error: error.message, stack: error.stack });
  process.exit(1);
});