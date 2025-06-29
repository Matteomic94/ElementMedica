/**
 * Prisma Performance Optimization Configuration
 * Week 5 - Database Performance Enhancement
 * 
 * This module provides optimized Prisma client configuration
 * with connection pooling, query optimization, and caching
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

// Performance monitoring middleware
const performanceMiddleware = {
  query: async (params, next) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1000ms)
    if (duration > 1000) {
      logger.warn('Slow query detected', {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
        args: JSON.stringify(params.args, null, 2)
      });
    }
    
    // Log query metrics for monitoring
    logger.debug('Query executed', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`
    });
    
    return result;
  }
};

// Query optimization helpers
const queryOptimizations = {
  // Common select fields to avoid fetching unnecessary data
  commonSelects: {
    company: {
      id: true,
      ragione_sociale: true,
      codice_fiscale: true,
      piva: true,
      mail: true,
      telefono: true,
      eliminato: true,
      created_at: true,
      updated_at: true
    },
    employee: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      codice_fiscale: true,
      companyId: true,
      eliminato: true,
      created_at: true
    },
    course: {
      id: true,
      title: true,
      category: true,
      code: true,
      duration: true,
      status: true,
      eliminato: true,
      created_at: true
    },
    schedule: {
      id: true,
      courseId: true,
      companyId: true,
      start_date: true,
      end_date: true,
      location: true,
      max_participants: true,
      status: true,
      eliminato: true
    },
    user: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      roleId: true,
      lastLogin: true,
      eliminato: true
    }
  },
  
  // Common where clauses for active records
  activeOnly: {
    eliminato: false
  },
  
  // Optimized include patterns to avoid N+1 queries
  optimizedIncludes: {
    scheduleWithDetails: {
      course: {
        select: {
          id: true,
          title: true,
          category: true,
          code: true,
          duration: true
        }
      },
      company: {
        select: {
          id: true,
          ragione_sociale: true,
          codice_fiscale: true
        }
      },
      trainer: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true
        }
      },
      enrollments: {
        where: { eliminato: false },
        select: {
          id: true,
          status: true,
          employee: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              codice_fiscale: true
            }
          }
        }
      }
    },
    
    employeeWithCompany: {
      company: {
        select: {
          id: true,
          ragione_sociale: true,
          codice_fiscale: true
        }
      }
    },
    
    userWithRole: {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
          permissions: {
            select: {
              id: true,
              name: true,
              resource: true,
              action: true
            }
          }
        }
      }
    }
  }
};

// Batch operation helpers
const batchOperations = {
  // Batch create with transaction
  async batchCreate(model, data, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const batchResult = await prisma.$transaction(
          batch.map(item => prisma[model].create({ data: item }))
        );
        results.push(...batchResult);
        
        logger.info(`Batch created ${batchResult.length} ${model} records`);
      } catch (error) {
        logger.error(`Batch create failed for ${model}`, { error: error.message, batch: i });
        throw error;
      }
    }
    
    return results;
  },
  
  // Batch update with transaction
  async batchUpdate(model, updates, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      try {
        const batchResult = await prisma.$transaction(
          batch.map(update => 
            prisma[model].update({
              where: { id: update.id },
              data: update.data
            })
          )
        );
        results.push(...batchResult);
        
        logger.info(`Batch updated ${batchResult.length} ${model} records`);
      } catch (error) {
        logger.error(`Batch update failed for ${model}`, { error: error.message, batch: i });
        throw error;
      }
    }
    
    return results;
  }
};

// Connection pool configuration
const connectionConfig = {
  // Logging configuration
  log: [
    {
      emit: 'event',
      level: 'query'
    },
    {
      emit: 'event', 
      level: 'error'
    },
    {
      emit: 'event',
      level: 'warn'
    }
  ]
};

// Create optimized Prisma client
const createOptimizedPrismaClient = () => {
  const client = new PrismaClient(connectionConfig);
  
  // Add performance middleware
  client.$use(performanceMiddleware.query);
  
  // Add query logging
  client.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Prisma Query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
        target: e.target
      });
    }
  });
  
  client.$on('error', (e) => {
    logger.error('Prisma Error', {
      message: e.message,
      target: e.target
    });
  });
  
  client.$on('warn', (e) => {
    logger.warn('Prisma Warning', {
      message: e.message,
      target: e.target
    });
  });
  
  return client;
};

// Connection health check
const checkDatabaseHealth = async (client) => {
  try {
    await client.$queryRaw`SELECT 1`;
    logger.info('Database connection healthy');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    return false;
  }
};

// Graceful shutdown
const gracefulShutdown = async (client) => {
  try {
    await client.$disconnect();
    logger.info('Prisma client disconnected gracefully');
  } catch (error) {
    logger.error('Error during Prisma client shutdown', { error: error.message });
  }
};

// Export optimized client and utilities
export {
  createOptimizedPrismaClient,
  queryOptimizations,
  batchOperations,
  checkDatabaseHealth,
  gracefulShutdown,
  performanceMiddleware
};