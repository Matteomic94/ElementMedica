/**
 * Authentication Routes
 * Handles login, logout, registration, password reset, and token refresh
 */

import express from 'express';
import { JWTService, PasswordService } from './jwt.js';
import middleware from './middleware.js';
const { authenticate, authorize, rateLimit, auditLog } = middleware;
import { createOptimizedPrismaClient } from '../config/prisma-optimization.js';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();

// Inizializzazione Prisma con gestione errori
let prisma;
try {
  prisma = createOptimizedPrismaClient();
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error);
  throw new Error('Database connection failed');
}

// Verifica che prisma sia definito
if (!prisma) {
  throw new Error('Prisma client is undefined');
}

/**
 * Validation middleware
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array()
        });
    }
    next();
};

/**
 * Get device info from request
 */
function getDeviceInfo(req) {
    return {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        platform: req.get('X-Platform') || 'web',
        deviceId: req.get('X-Device-ID') || null
    };
}

/**
 * POST /auth/login
 * User login with email and password
 */
// Debug middleware rimosso per evitare problemi

router.post('/login', 
    rateLimit({ maxRequests: 100, windowMs: 15 * 60 * 1000 }), // 100 attempts per 15 minutes (temporary for testing)
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 1 })
    ],
    validateRequest,
    auditLog('LOGIN', 'auth'),
    async (req, res) => {
        try {
            const { email, password, rememberMe = false } = req.body;
            const deviceInfo = getDeviceInfo(req);

            // Find user with roles
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    userRoles: {
                        where: { isActive: true },
                        include: {
                            role: {
                                include: {
                                    rolePermissions: true
                                }
                            }
                        }
                    },
                    company: true
                }
            });

            if (!user) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'AUTH_INVALID_CREDENTIALS'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    error: 'Account is deactivated',
                    code: 'AUTH_ACCOUNT_DEACTIVATED'
                });
            }

            // Check if account is locked
            if (user.lockedUntil && user.lockedUntil > new Date()) {
                return res.status(423).json({
                    error: 'Account is temporarily locked',
                    code: 'AUTH_ACCOUNT_LOCKED',
                    lockedUntil: user.lockedUntil
                });
            }

            // Verify password
            const isValidPassword = await PasswordService.verifyPassword(password, user.password);
            
            if (!isValidPassword) {
                // Increment failed login attempts
                const failedAttempts = (user.failedAttempts || 0) + 1;
                const updateData = {
                    failedAttempts: failedAttempts
                };

                // Lock account after 5 failed attempts
                if (failedAttempts >= 5) {
                    updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: updateData
                });

                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'AUTH_INVALID_CREDENTIALS',
                    attemptsRemaining: Math.max(0, 5 - failedAttempts)
                });
            }

            // Reset failed login attempts on successful login
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedAttempts: 0,
                    lockedUntil: null,
                    lastLogin: new Date()
                }
            });

            // Prepare user data with roles and permissions
            const roles = user.userRoles.map(ur => ur.role.name);
            const permissions = user.userRoles.flatMap(ur => ur.role.rolePermissions || []);
            
            // Add global role if present
            if (user.globalRole) {
                roles.push(user.globalRole);
            }

            const userWithRoles = {
                ...user,
                roles,
                permissions
            };

            // Generate tokens
            const tokens = await JWTService.generateTokenPair(userWithRoles, deviceInfo);

            // Set HTTP-only cookies for web clients
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 7 days or 1 day
            };

            res.cookie('accessToken', tokens.accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
            res.cookie('sessionToken', tokens.sessionToken, cookieOptions);

            // Return user info and tokens
            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    companyId: user.companyId,
                    company: user.company,
                    roles,
                    permissions,
                    globalRole: user.globalRole,
                    lastLogin: user.lastLogin
                },
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn,
                    tokenType: tokens.tokenType
                }
            });

        } catch (error) {
            logger.error('Login failed', {
                component: 'auth-routes',
                action: 'login',
                error: error.message,
                stack: error.stack,
                email: req.body?.email,
                ip: req.ip
            });
            res.status(500).json({
                error: 'Login failed',
                code: 'AUTH_LOGIN_FAILED'
            });
        }
    }
);

/**
 * POST /auth/logout
 * User logout - invalidate session
 */
router.post('/logout',
    authenticate(),
    auditLog('LOGOUT', 'auth'),
    async (req, res) => {
        try {
            const sessionToken = req.cookies?.sessionToken;
            
            if (sessionToken) {
                await JWTService.revokeSession(sessionToken);
            }

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('sessionToken');

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            logger.error('Logout failed', {
                component: 'auth-routes',
                action: 'logout',
                error: error.message,
                stack: error.stack,
                userId: req.user?.id
            });
            res.status(500).json({
                error: 'Logout failed',
                code: 'AUTH_LOGOUT_FAILED'
            });
        }
    }
);

/**
 * POST /auth/logout-all
 * Logout from all devices
 */
router.post('/logout-all',
    authenticate(),
    auditLog('LOGOUT_ALL', 'auth'),
    async (req, res) => {
        try {
            await JWTService.revokeAllUserSessions(req.user.id);

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('sessionToken');

            res.json({
                success: true,
                message: 'Logged out from all devices'
            });

        } catch (error) {
            logger.error('Logout all failed', {
                component: 'auth-routes',
                action: 'logoutAll',
                error: error.message,
                stack: error.stack,
                userId: req.user?.id
            });
            res.status(500).json({
                error: 'Logout failed',
                code: 'AUTH_LOGOUT_ALL_FAILED'
            });
        }
    }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
    rateLimit({ maxRequests: 10, windowMs: 15 * 60 * 1000 }),
    async (req, res) => {
        try {
            const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    error: 'Refresh token required',
                    code: 'AUTH_REFRESH_TOKEN_MISSING'
                });
            }

            const tokens = await JWTService.refreshAccessToken(refreshToken);

            // Update access token cookie
            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.json({
                success: true,
                tokens
            });

        } catch (error) {
            logger.error('Token refresh failed', {
            component: 'auth-routes',
            action: 'refreshToken',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
            
            // Clear invalid cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.clearCookie('sessionToken');
            
            res.status(401).json({
                error: 'Token refresh failed',
                code: 'AUTH_REFRESH_FAILED'
            });
        }
    }
);

/**
 * POST /auth/register
 * User registration (admin only)
 */
router.post('/register',
    authenticate(),
    authorize(['users.create']),
    rateLimit({ maxRequests: 10, windowMs: 60 * 60 * 1000 }), // 10 registrations per hour
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('firstName').isLength({ min: 1 }).trim(),
        body('lastName').isLength({ min: 1 }).trim(),
        body('companyId').isUUID().optional(),
        body('roles').isArray().optional()
    ],
    validateRequest,
    auditLog('REGISTER', 'auth'),
    async (req, res) => {
        try {
            const {
                email,
                password,
                firstName,
                lastName,
                companyId,
                employeeId,
                roles = ['employee']
            } = req.body;

            // Validate password strength
            const passwordValidation = PasswordService.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    error: 'Password does not meet requirements',
                    code: 'AUTH_WEAK_PASSWORD',
                    details: passwordValidation.errors
                });
            }

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    error: 'User already exists',
                    code: 'AUTH_USER_EXISTS'
                });
            }

            // Hash password
            const passwordHash = await PasswordService.hashPassword(password);

            // Use requester's company if not specified (unless global admin)
            const targetCompanyId = companyId || 
                (req.user.roles.includes('global_admin') ? null : req.user.companyId);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    password_hash: passwordHash,
                    first_name: firstName,
                    last_name: lastName,
                    company_id: targetCompanyId,
                    employee_id: employeeId,
                    created_by: req.user.id
                }
            });

            // Assign roles
            for (const roleName of roles) {
                const role = await prisma.roles.findFirst({
                    where: {
                        name: roleName,
                        OR: [
                            { is_system_role: true },
                            { company_id: targetCompanyId }
                        ]
                    }
                });

                if (role) {
                    await prisma.userRole.create({
                        data: {
                            userId: user.id,
                            roleId: role.id,
                            companyId: targetCompanyId,
                            assignedBy: req.user.id
                        }
                    });
                }
            }

            res.status(201).json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    companyId: user.company_id,
                    roles
                }
            });

        } catch (error) {
            logger.error('Registration failed', {
            component: 'auth-routes',
            action: 'register',
            error: error.message,
            stack: error.stack,
            email: req.body?.email
        });
            res.status(500).json({
                error: 'Registration failed',
                code: 'AUTH_REGISTRATION_FAILED'
            });
        }
    }
);

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me',
    authenticate(),
    async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    userRoles: {
                        where: { isActive: true },
                        include: {
                            role: true
                        }
                    },
                    company: true,
                    employee: true
                }
            });

            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'AUTH_USER_NOT_FOUND'
                });
            }

            const roles = user.userRoles.map(ur => ur.role.name);
            const permissions = user.userRoles.flatMap(ur => ur.role.permissions || []);

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    avatarUrl: user.avatar_url,
                    language: user.language,
                    timezone: user.timezone,
                    companyId: user.company_id,
                    employeeId: user.employee_id,
                    company: user.company,
                    employee: user.employee,
                    roles,
                    permissions,
                    isActive: user.isActive,
                    isVerified: user.is_verified,
                    lastLogin: user.last_login_at,
                    createdAt: user.created_at
                }
            });

        } catch (error) {
            logger.error('Failed to get user profile', {
            component: 'auth-routes',
            action: 'getUser',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
            res.status(500).json({
                error: 'Failed to get user info',
                code: 'AUTH_GET_USER_FAILED'
            });
        }
    }
);

/**
 * PUT /auth/me
 * Update current user profile
 */
router.put('/me',
    authenticate(),
    [
        body('firstName').optional().isLength({ min: 1 }).trim(),
        body('lastName').optional().isLength({ min: 1 }).trim(),
        body('phone').optional().isMobilePhone(),
        body('language').optional().isIn(['it', 'en']),
        body('timezone').optional().isLength({ min: 1 })
    ],
    validateRequest,
    auditLog('UPDATE_PROFILE', 'auth'),
    async (req, res) => {
        try {
            const {
                firstName,
                lastName,
                phone,
                language,
                timezone
            } = req.body;

            const updateData = {};
            if (firstName !== undefined) updateData.first_name = firstName;
            if (lastName !== undefined) updateData.last_name = lastName;
            if (phone !== undefined) updateData.phone = phone;
            if (language !== undefined) updateData.language = language;
            if (timezone !== undefined) updateData.timezone = timezone;
            
            updateData.updated_by = req.user.id;

            const user = await prisma.user.update({
                where: { id: req.user.id },
                data: updateData
            });

            res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    language: user.language,
                    timezone: user.timezone
                }
            });

        } catch (error) {
            logger.error('Failed to update profile', {
            component: 'auth-routes',
            action: 'updateProfile',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
            res.status(500).json({
                error: 'Failed to update profile',
                code: 'AUTH_UPDATE_PROFILE_FAILED'
            });
        }
    }
);

/**
 * POST /auth/change-password
 * Change user password
 */
router.post('/change-password',
    authenticate(),
    rateLimit({ maxRequests: 5, windowMs: 60 * 60 * 1000 }), // 5 attempts per hour
    [
        body('currentPassword').isLength({ min: 1 }),
        body('newPassword').isLength({ min: 8 })
    ],
    validateRequest,
    auditLog('CHANGE_PASSWORD', 'auth'),
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            // Get current user
            const user = await prisma.user.findUnique({
                where: { id: req.user.id }
            });

            // Verify current password
            const isValidPassword = await PasswordService.verifyPassword(currentPassword, user.passwordHash);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Current password is incorrect',
                    code: 'AUTH_INVALID_CURRENT_PASSWORD'
                });
            }

            // Validate new password strength
            const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    error: 'New password does not meet requirements',
                    code: 'AUTH_WEAK_PASSWORD',
                    details: passwordValidation.errors
                });
            }

            // Hash new password
            const newPasswordHash = await PasswordService.hashPassword(newPassword);

            // Update password
            await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    password_hash: newPasswordHash,
                    password_changed_at: new Date(),
                    updated_by: req.user.id
                }
            });

            // Revoke all sessions except current one
            const sessionToken = req.cookies?.sessionToken;
            if (sessionToken) {
                await prisma.userSession.updateMany({
                    where: {
                        userId: req.user.id,
                        sessionToken: { not: sessionToken },
                        isActive: true
                    },
                    data: {
                        isActive: false
                    }
                });
            }

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            logger.error('Failed to change password', {
            component: 'auth-routes',
            action: 'changePassword',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
            res.status(500).json({
                error: 'Failed to change password',
                code: 'AUTH_CHANGE_PASSWORD_FAILED'
            });
        }
    }
);

/**
 * GET /auth/sessions
 * Get user's active sessions
 */
router.get('/sessions',
    authenticate(),
    async (req, res) => {
        try {
            const sessions = await prisma.userSession.findMany({
                where: {
                    userId: req.user.id,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                select: {
                    id: true,
                    session_token: true,
                    device_info: true,
                    ip_address: true,
                    last_activity: true,
                    created_at: true
                },
                orderBy: {
                    last_activity: 'desc'
                }
            });

            const currentSessionToken = req.cookies?.sessionToken;

            res.json({
                success: true,
                sessions: sessions.map(session => ({
                    ...session,
                    isCurrent: session.session_token === currentSessionToken
                }))
            });

        } catch (error) {
            logger.error('Failed to get sessions', {
            component: 'auth-routes',
            action: 'getSessions',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
            res.status(500).json({
                error: 'Failed to get sessions',
                code: 'AUTH_GET_SESSIONS_FAILED'
            });
        }
    }
);

/**
 * DELETE /auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId',
    authenticate(),
    auditLog('REVOKE_SESSION', 'auth'),
    async (req, res) => {
        try {
            const { sessionId } = req.params;

            await prisma.userSession.updateMany({
                where: {
                    id: sessionId,
                    userId: req.user.id,
                    isActive: true
                },
                data: {
                    isActive: false
                }
            });

            res.json({
                success: true,
                message: 'Session revoked successfully'
            });

        } catch (error) {
            logger.error('Failed to revoke session', {
            component: 'auth-routes',
            action: 'revokeSession',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            sessionId: req.params?.sessionId
        });
            res.status(500).json({
                error: 'Failed to revoke session',
                code: 'AUTH_REVOKE_SESSION_FAILED'
            });
        }
    }
);

/**
 * Token verification endpoint
 * GET /verify
 * Verifies if the provided token is valid
 */
router.get('/verify', authenticate(), async (req, res) => {
    try {
        // If we reach here, the token is valid (authenticate middleware passed)
        res.json({
            valid: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Token verification failed', {
            component: 'auth-routes',
            action: 'verify',
            error: error.message,
            stack: error.stack
        });
        res.status(401).json({
            valid: false,
            error: 'Token verification failed',
            code: 'TOKEN_VERIFICATION_FAILED'
        });
    }
});

export default router;