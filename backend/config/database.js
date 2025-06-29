/**
 * Database Configuration with Optimizations
 * Week 5: Database and Performance Optimization
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

// Database configuration with connection pooling
const databaseConfig = {
  // Connection pooling configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  
  // Query optimization settings
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event', 
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  
  // Error formatting
  errorFormat: 'pretty',
  
  // Transaction options
  transactionOptions: {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    isolationLevel: 'ReadCommitted'
  }
};

/**
 * Optimized Prisma Client Configuration for Week 5
 * Includes connection pooling, query optimization, and performance monitoring
 */
class OptimizedPrismaClient {
  constructor() {
    this.client = new PrismaClient(databaseConfig);
    this.setupEventListeners();
    this.setupMiddleware();
  }

  setupEventListeners() {
    // Query logging for performance monitoring
    this.client.$on('query', (e) => {
      if (e.duration > 1000) { // Log slow queries (>1s)
        logger.warn('Slow query detected', {
          query: e.query,
          duration: `${e.duration}ms`,
          params: e.params,
          component: 'database'
        });
      } else {
        logger.debug('Database query executed', {
          duration: `${e.duration}ms`,
          component: 'database'
        });
      }
    });

    // Error logging
    this.client.$on('error', (e) => {
      logger.error('Database error', {
        error: e.message,
        component: 'database'
      });
    });

    // Info logging
    this.client.$on('info', (e) => {
      logger.info('Database info', {
        message: e.message,
        component: 'database'
      });
    });

    // Warning logging
    this.client.$on('warn', (e) => {
      logger.warn('Database warning', {
        message: e.message,
        component: 'database'
      });
    });
  }

  setupMiddleware() {
    // Performance monitoring middleware
    this.client.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const end = Date.now();
      const duration = end - start;

      // Log performance metrics
      logger.debug('Database operation completed', {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
        component: 'database-performance'
      });

      return result;
    });

    // Soft delete middleware
    this.client.$use(async (params, next) => {
      // Determine the soft delete field based on model
      const getSoftDeleteField = (modelName) => {
        // Person model uses 'isDeleted', all others use 'eliminato'
        return modelName === 'Person' ? 'isDeleted' : 'eliminato';
      };
      
      const softDeleteField = getSoftDeleteField(params.model);
      
      // Handle soft delete for models with soft delete field
      if (params.action === 'delete') {
        // Change delete to update with soft delete = true
        params.action = 'update';
        params.args.data = { [softDeleteField]: true };
      }
      
      if (params.action === 'deleteMany') {
        // Change deleteMany to updateMany with soft delete = true
        params.action = 'updateMany';
        if (params.args.data) {
          params.args.data[softDeleteField] = true;
        } else {
          params.args.data = { [softDeleteField]: true };
        }
      }

      // Filter out soft deleted records for read operations
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.args.where = { ...params.args.where, [softDeleteField]: false };
      }
      
      if (params.action === 'findMany') {
        if (params.args.where) {
          if (params.args.where[softDeleteField] === undefined) {
            params.args.where[softDeleteField] = false;
          }
        } else {
          params.args.where = { [softDeleteField]: false };
        }
      }

      return next(params);
    });

    // Type conversion middleware for numeric fields
    this.client.$use(async (params, next) => {
      // Only for Course model
      if (params.model === 'Course') {
        if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
          const data = params.args.data;
          
          if (data) {
            const convertNumericField = (value, isInteger = false) => {
              if (value === null || value === '' || value === undefined) return null;
              const num = Number(value);
              if (isNaN(num)) return null;
              return isInteger ? Math.round(num) : num;
            };
            
            // Convert numeric fields
            if ('validityYears' in data) {
              data.validityYears = convertNumericField(data.validityYears, true);
            }
            if ('maxPeople' in data) {
              data.maxPeople = convertNumericField(data.maxPeople, true);
            }
            if ('pricePerPerson' in data) {
              data.pricePerPerson = convertNumericField(data.pricePerPerson);
            }
          }
        }
      }

      return next(params);
    });
  }

  // Health check method
  async healthCheck() {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return { status: 'healthy', message: 'Database connection is healthy' };
    } catch (error) {
      logger.error('Database health check failed', {
        error: error.message,
        component: 'database-health'
      });
      return { status: 'unhealthy', message: error.message };
    }
  }

  // Connection info
  async getConnectionInfo() {
    try {
      const result = await this.client.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      return result[0];
    } catch (error) {
      logger.error('Failed to get connection info', {
        error: error.message,
        component: 'database-info'
      });
      return null;
    }
  }

  // Query performance statistics
  async getQueryStats() {
    try {
      const result = await this.client.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        ORDER BY total_time DESC 
        LIMIT 10
      `;
      return result;
    } catch (error) {
      logger.warn('pg_stat_statements not available', {
        error: error.message,
        component: 'database-stats'
      });
      return [];
    }
  }

  // Graceful shutdown
  async disconnect() {
    try {
      await this.client.$disconnect();
      logger.info('Database connection closed gracefully', {
        component: 'database'
      });
    } catch (error) {
      logger.error('Error closing database connection', {
        error: error.message,
        component: 'database'
      });
    }
  }

  // Get the Prisma client instance
  getClient() {
    return this.client;
  }
}

// Create singleton instance
const optimizedPrisma = new OptimizedPrismaClient();

// Export optimized Prisma client instance
export default optimizedPrisma;

// Note: Graceful shutdown is handled by the main server files
// to avoid conflicts with multiple process.on listeners