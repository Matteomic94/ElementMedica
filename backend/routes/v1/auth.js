/**
 * Authentication Routes v1
 * Versioned authentication endpoints
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../auth/middleware.js';
import { authenticateAdvanced } from '../../middleware/auth-advanced.js';
import { authenticateDebug } from '../../auth/middleware-debug.js';
import { serviceCircuitBreaker } from '../../middleware/circuit-breaker.js';
import authService from '../../services/authService.js';
import logger from '../../utils/logger.js';
import { requirePermissions } from '../../middleware/rbac.js';

const router = express.Router();
const prisma = new PrismaClient();

// Temporary logging middleware to trace requests
router.use((req, res, next) => {
  // Logging disabled to prevent JSON response interference
  next();
});

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per window (increased for testing - was 5)
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    error: 'Too many registration attempts',
    message: 'Please try again later'
  }
});

// Handle all other HTTP methods for /login endpoint with 405 Method Not Allowed
const methodNotAllowedHandler = (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: `Method ${req.method} is not allowed for this endpoint. Only POST is supported.`,
    allowedMethods: ['POST']
  });
};

router.get('/login', methodNotAllowedHandler);
router.put('/login', methodNotAllowedHandler);
router.patch('/login', methodNotAllowedHandler);
router.delete('/login', methodNotAllowedHandler);
router.head('/login', methodNotAllowedHandler);
router.options('/login', methodNotAllowedHandler);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email, username, or tax code
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "Admin123!"
 *               remember_me:
 *                 type: boolean
 *                 default: false
 *                 description: Extended session duration
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', 
  authLimiter,
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email, username, or tax code is required')
      .custom((value) => {
        // Verifica che sia email, username o codice fiscale
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const taxCodeRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
        
        if (emailRegex.test(value) || taxCodeRegex.test(value) || value.length >= 3) {
          return true;
        }
        throw new Error('Must be a valid email, tax code, or username');
      }),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  async (req, res) => {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      const { identifier, password, remember_me = false } = req.body;

      // Verify credentials using AuthService
      const credentialsResult = await authService.verifyCredentials(identifier, password);
      
      if (!credentialsResult.success) {
        logger.warn('Login attempt failed', { identifier, error: credentialsResult.error });
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Identifier or password is incorrect'
        });
      }

      const person = credentialsResult.person;

      // Generate tokens using AuthService
      const tokens = authService.generateTokens(person, remember_me);

      // Store refresh token
      const expiresAt = new Date(Date.now() + (remember_me ? 30 : 7) * 24 * 60 * 60 * 1000);
      await authService.saveRefreshToken(
        tokens.refreshToken,
        person.id,
        expiresAt,
        req.get('User-Agent'),
        req.ip
      );

      // Update last login
      await authService.updateLastLogin(person.id);

      logger.info('Person logged in successfully', {
        personId: person.id,
        email: person.email,
        identifier: identifier,
        companyId: person.companyId
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user: {
            id: person.id,
            personId: person.id,
            email: person.email,
            username: person.username,
            taxCode: person.taxCode,
            firstName: person.firstName,
            lastName: person.lastName,
            companyId: person.companyId,
            tenantId: person.tenantId,
            roles: authService.getPersonRoles(person),
            company: person.company ? {
              id: person.company.id,
              name: person.company.name,
              type: person.company.type
            } : null,
            tenant: person.tenant ? {
              id: person.tenant.id,
              name: person.tenant.name
            } : null
          }
        }
      });
    } catch (error) {
      logger.error('Login error', {
        error: error.message,
        stack: error.stack,
        email: req.body.email
      });
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during login'
      });
    }
  }
);



/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *               companyId:
 *                 type: integer
 *                 description: Optional company association
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already exists
 *       429:
 *         description: Too many registration attempts
 */
router.post('/register',
  registerLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('firstName')
      .isLength({ min: 2 })
      .trim()
      .withMessage('First name must be at least 2 characters'),
    body('lastName')
      .isLength({ min: 2 })
      .trim()
      .withMessage('Last name must be at least 2 characters')
  ],
  async (req, res, next) => {
    const circuitBreakerHandler = serviceCircuitBreaker('auth-register', async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid input data',
          details: errors.array()
        });
      }

      const { email, password, firstName, lastName, companyId } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'An account with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          companyId: companyId || null,
          role: 'user', // Default role
          isActive: true
        },
        include: {
          company: true
        }
      });

      // Assign default user role
      const defaultRole = await prisma.role.findFirst({
        where: { name: 'user' }
      });

      if (defaultRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: defaultRole.id
          }
        });
      }

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email
      });

      // Generate tokens for immediate login
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        roles: ['user'],
        permissions: []
      };

      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          userAgent: req.get('User-Agent') || 'Unknown',
          ipAddress: req.ip
        }
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          company: user.company ? {
            id: user.company.id,
            name: user.company.name
          } : null
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: 60 * 60, // 1 hour in seconds
          token_type: 'Bearer'
        }
      });
    } catch (error) {
      logger.error('Registration error', {
        error: error.message,
        stack: error.stack,
        email: req.body.email
      });
      
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during registration'
      });
    }
    });
    
    try {
      await circuitBreakerHandler(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     tags: [Authentication]
 *     security:
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 expires_in:
 *                   type: integer
 *                 token_type:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.headers['x-refresh-token'] || req.body.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if refresh token exists and is valid
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date()
        },
        revokedAt: null
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!storedToken || !storedToken.user.isActive) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
    }

    const user = storedToken.user;

    // Generate new access token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      roles: user.userRoles.map(ur => ur.role.name),
      permissions: user.userRoles.flatMap(ur => 
        ur.role.rolePermissions.map(rp => rp.permission.name)
      )
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info('Token refreshed successfully', {
      userId: user.id,
      email: user.email
    });

    res.json({
      access_token: accessToken,
      expires_in: 60 * 60, // 1 hour in seconds
      token_type: 'Bearer'
    });
  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(401).json({
      error: 'Invalid refresh token',
      message: 'Unable to refresh token'
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Revoke refresh token and logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/logout', authenticateAdvanced, async (req, res) => {
  try {
    const refreshToken = req.headers['x-refresh-token'] || req.body.refresh_token;
    
    if (refreshToken) {
      // Revoke specific refresh token
      await prisma.refreshToken.updateMany({
        where: {
          token: refreshToken,
          userId: req.user.userId
        },
        data: {
          revokedAt: new Date()
        }
      });
    } else {
      // Revoke all refresh tokens for user
      await prisma.refreshToken.updateMany({
        where: {
          userId: req.user.userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
    }

    logger.info('User logged out successfully', {
      userId: req.user.userId,
      email: req.user.email
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get current authenticated user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authenticateAdvanced, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        company: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      company: user.company ? {
        id: user.company.id,
        name: user.company.name
      } : null,
      roles: user.userRoles.map(ur => ur.role.name),
      permissions: user.userRoles.flatMap(ur => 
        ur.role.rolePermissions.map(rp => rp.permission.name)
      )
    });
  } catch (error) {
    logger.error('Get user error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred while retrieving user information'
    });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     description: Verifies if the provided JWT token is valid and returns user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify', (req, res, next) => {
  // Debug logging disabled to prevent JSON response interference
  next();
}, authenticate(), async (req, res) => {
  try {
    // If we reach here, the token is valid (authenticate middleware passed)
    const user = req.user;
    
    // User data is already loaded by authenticate middleware
    // No need for additional database queries
    
    res.json({
      valid: true,
      user: {
        id: user.id,
        personId: user.personId,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        tenantId: user.tenantId,
        roles: user.roles,
        company: user.company,
        tenant: user.tenant,
        isVerified: user.isVerified
      },
      permissions: user.roles, // Using roles as permissions for now
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Token verification failed', {
      component: 'auth-v1-routes',
      action: 'verify',
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId
    });
    
    res.status(401).json({
      valid: false,
      error: 'Token verification failed',
      message: 'Invalid or expired token',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
});

// Get user permissions
router.get('/permissions/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { roles } = req.user;
    
    // Verify that the requested userId matches the authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied: Cannot access other user permissions',
        code: 'AUTH_ACCESS_DENIED'
      });
    }
    
    res.json({
      success: true,
      permissions: roles || [],
      role: req.user.role || 'EMPLOYEE',
      userId: req.user.id,
      email: req.user.email
    });
  } catch (error) {
    logger.error('Failed to get user permissions', {
      error: error.message,
      stack: error.stack,
      action: 'getPermissions',
      userId: req.user?.id
    });
    
    res.status(500).json({
      error: 'Failed to get permissions',
      code: 'AUTH_GET_PERMISSIONS_FAILED'
    });
  }
});

// Route di test temporanea per debug
router.get('/test-debug', async (req, res) => {
  logger.info('🔍 [TEST DEBUG] Route di test chiamata');
  res.json({
    message: 'Test route funziona',
    timestamp: new Date().toISOString(),
    server: 'api-server.js'
  });
});

export default router;