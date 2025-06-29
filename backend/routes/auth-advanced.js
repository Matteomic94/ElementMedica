/**
 * Advanced Authentication Routes
 * Enhanced authentication endpoints with JWT refresh, session management, and GDPR compliance
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AdvancedJWTService } from '../auth/jwt-advanced.js';
import { GDPRService } from '../services/gdpr-service.js';
import {
    authenticateAdvanced,
    authRateLimit,
    trackFailedLogin,
    checkAccountLock,
    deviceFingerprint,
    limitConcurrentSessions
} from '../middleware/auth-advanced.js';
import logger from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Enhanced Login with refresh tokens and session management
 */
router.post('/login',
    authRateLimit,
    deviceFingerprint,
    checkAccountLock,
    trackFailedLogin,
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 1 }),
        body('rememberMe').optional().isBoolean(),
        body('deviceName').optional().isString().trim()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }
            
            const { email, password, rememberMe = false, deviceName } = req.body;
            
            // Find user with roles
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    userRoles: {
                        where: { isActive: true },
                        include: {
                            role: true
                        }
                    }
                }
            });
            
            if (!user || !user.isActive) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'AUTH_INVALID_CREDENTIALS'
                });
            }
            
            // Check if account is locked
            if (user.lockedUntil && user.lockedUntil > new Date()) {
                const remainingTime = Math.ceil((user.lockedUntil - new Date()) / (1000 * 60));
                return res.status(423).json({
                    error: 'Account temporarily locked',
                    code: 'AUTH_ACCOUNT_LOCKED',
                    remainingTime
                });
            }
            
            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'AUTH_INVALID_CREDENTIALS'
                });
            }
            
            // Check concurrent session limits
            const maxSessions = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 3;
            await AdvancedJWTService.cleanupExpiredSessions(user.id);
            
            const activeSessions = await prisma.userSession.count({
                where: {
                    userId: user.id,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });
            
            if (activeSessions >= maxSessions) {
                // Deactivate oldest session
                const oldestSession = await prisma.userSession.findFirst({
                    where: {
                        userId: user.id,
                        isActive: true,
                        expiresAt: {
                            gt: new Date()
                        }
                    },
                    orderBy: {
                        lastActivityAt: 'asc'
                    }
                });
                
                if (oldestSession) {
                    await prisma.userSession.update({
                        where: { id: oldestSession.id },
                        data: { isActive: false }
                    });
                }
            }
            
            // Create new session
            const sessionTimeout = rememberMe 
                ? parseInt(process.env.EXTENDED_SESSION_TIMEOUT_HOURS) || 720 // 30 days
                : parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 60; // 1 hour
            
            const session = await prisma.userSession.create({
                data: {
                    userId: user.id,
                    deviceFingerprint: req.deviceFingerprint,
                    deviceName: deviceName || 'Unknown Device',
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    expiresAt: new Date(Date.now() + sessionTimeout * 60 * 1000),
                    lastActivityAt: new Date(),
                    isActive: true
                }
            });
            
            // Generate tokens
            const tokens = await AdvancedJWTService.generateTokens(user.id, session.id, {
                rememberMe,
                deviceFingerprint: req.deviceFingerprint
            });
            
            // Update user login info
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLogin: new Date(),
                    failedLoginAttempts: 0,
                    lockedUntil: null
                }
            });
            
            // Record GDPR consent for authentication
            await GDPRService.recordConsent(
                user.id,
                'authentication',
                'User authentication and session management',
                'legitimate_interest'
            );
            
            // Log successful login
            await GDPRService.logGDPRActivity({
                userId: user.id,
                action: 'USER_LOGIN',
                dataType: 'authentication',
                purpose: 'User authentication',
                legalBasis: 'legitimate_interest',
                details: {
                    sessionId: session.id,
                    deviceFingerprint: req.deviceFingerprint,
                    rememberMe
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            logger.info('User logged in successfully', {
                component: 'auth-advanced',
                action: 'login',
                userId: user.id,
                email: user.email,
                sessionId: session.id,
                ip: req.ip,
                rememberMe
            });
            
            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    companyId: user.companyId,
                    roles: user.userRoles.map(ur => ur.role.name)
                },
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresIn: tokens.expiresIn
                },
                session: {
                    id: session.id,
                    expiresAt: session.expiresAt
                }
            });
            
        } catch (error) {
            logger.error('Login failed', {
                component: 'auth-advanced',
                action: 'login',
                error: error.message,
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
 * Refresh Access Token
 */
router.post('/refresh',
    [
        body('refreshToken').isString().notEmpty()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors.array()
                });
            }
            
            const { refreshToken } = req.body;
            
            // Refresh tokens
            const result = await AdvancedJWTService.refreshTokens(refreshToken);
            
            if (!result.success) {
                return res.status(401).json({
                    error: result.error || 'Token refresh failed',
                    code: 'AUTH_REFRESH_FAILED'
                });
            }
            
            // Log token refresh
            await GDPRService.logGDPRActivity({
                userId: result.userId,
                action: 'TOKEN_REFRESHED',
                dataType: 'authentication',
                purpose: 'Token refresh for continued access',
                legalBasis: 'legitimate_interest',
                details: {
                    sessionId: result.sessionId
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            logger.info('Tokens refreshed successfully', {
                component: 'auth-advanced',
                action: 'refresh',
                userId: result.userId,
                sessionId: result.sessionId,
                ip: req.ip
            });
            
            res.json({
                message: 'Tokens refreshed successfully',
                tokens: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    expiresIn: result.expiresIn
                }
            });
            
        } catch (error) {
            logger.error('Token refresh failed', {
                component: 'auth-advanced',
                action: 'refresh',
                error: error.message,
                ip: req.ip
            });
            
            res.status(500).json({
                error: 'Token refresh failed',
                code: 'AUTH_REFRESH_FAILED'
            });
        }
    }
);

/**
 * Enhanced Logout with session cleanup
 */
router.post('/logout',
    authenticateAdvanced,
    async (req, res) => {
        try {
            const { sessionId, userId } = req.user;
            
            // Revoke all tokens for this session
            await AdvancedJWTService.revokeSession(sessionId);
            
            // Log logout
            await GDPRService.logGDPRActivity({
                userId,
                action: 'USER_LOGOUT',
                dataType: 'authentication',
                purpose: 'User logout and session cleanup',
                legalBasis: 'legitimate_interest',
                details: {
                    sessionId
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            logger.info('User logged out successfully', {
                component: 'auth-advanced',
                action: 'logout',
                userId,
                sessionId,
                ip: req.ip
            });
            
            res.json({
                message: 'Logout successful'
            });
            
        } catch (error) {
            logger.error('Logout failed', {
                component: 'auth-advanced',
                action: 'logout',
                error: error.message,
                userId: req.user?.userId,
                ip: req.ip
            });
            
            res.status(500).json({
                error: 'Logout failed',
                code: 'AUTH_LOGOUT_FAILED'
            });
        }
    }
);

/**
 * Logout from all devices
 */
router.post('/logout-all',
    authenticateAdvanced,
    async (req, res) => {
        try {
            const { userId } = req.user;
            
            // Revoke all user sessions
            await AdvancedJWTService.revokeAllUserSessions(userId);
            
            // Log logout from all devices
            await GDPRService.logGDPRActivity({
                userId,
                action: 'USER_LOGOUT_ALL',
                dataType: 'authentication',
                purpose: 'User logout from all devices',
                legalBasis: 'legitimate_interest',
                details: {
                    allSessions: true
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            logger.info('User logged out from all devices', {
                component: 'auth-advanced',
                action: 'logout-all',
                userId,
                ip: req.ip
            });
            
            res.json({
                message: 'Logged out from all devices successfully'
            });
            
        } catch (error) {
            logger.error('Logout from all devices failed', {
                component: 'auth-advanced',
                action: 'logout-all',
                error: error.message,
                userId: req.user?.userId,
                ip: req.ip
            });
            
            res.status(500).json({
                error: 'Logout from all devices failed',
                code: 'AUTH_LOGOUT_ALL_FAILED'
            });
        }
    }
);

/**
 * Get user sessions
 */
router.get('/sessions',
    authenticateAdvanced,
    async (req, res) => {
        try {
            const { userId } = req.user;
            
            const sessions = await prisma.userSession.findMany({
                where: {
                    userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                select: {
                    id: true,
                    deviceName: true,
                    deviceFingerprint: true,
                    ipAddress: true,
                    userAgent: true,
                    createdAt: true,
                    lastActivityAt: true,
                    expiresAt: true
                },
                orderBy: {
                    lastActivityAt: 'desc'
                }
            });
            
            // Mark current session
            const sessionsWithCurrent = sessions.map(session => ({
                ...session,
                isCurrent: session.id === req.user.sessionId
            }));
            
            res.json({
                sessions: sessionsWithCurrent,
                total: sessions.length
            });
            
        } catch (error) {
            logger.error('Failed to get user sessions', {
                component: 'auth-advanced',
                action: 'getSessions',
                error: error.message,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                error: 'Failed to get sessions',
                code: 'AUTH_GET_SESSIONS_FAILED'
            });
        }
    }
);

/**
 * Revoke specific session
 */
router.delete('/sessions/:sessionId',
    authenticateAdvanced,
    async (req, res) => {
        try {
            const { userId } = req.user;
            const { sessionId } = req.params;
            
            // Verify session belongs to user
            const session = await prisma.userSession.findFirst({
                where: {
                    id: sessionId,
                    userId
                }
            });
            
            if (!session) {
                return res.status(404).json({
                    error: 'Session not found',
                    code: 'AUTH_SESSION_NOT_FOUND'
                });
            }
            
            // Revoke session
            await AdvancedJWTService.revokeSession(sessionId);
            
            // Log session revocation
            await GDPRService.logGDPRActivity({
                userId,
                action: 'SESSION_REVOKED',
                dataType: 'authentication',
                purpose: 'Manual session revocation',
                legalBasis: 'legitimate_interest',
                details: {
                    revokedSessionId: sessionId
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            logger.info('Session revoked successfully', {
                component: 'auth-advanced',
                action: 'revokeSession',
                userId,
                revokedSessionId: sessionId,
                ip: req.ip
            });
            
            res.json({
                message: 'Session revoked successfully'
            });
            
        } catch (error) {
            logger.error('Failed to revoke session', {
                component: 'auth-advanced',
                action: 'revokeSession',
                error: error.message,
                userId: req.user?.userId,
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
 * Verify token endpoint
 */
router.post('/verify',
    authenticateAdvanced,
    async (req, res) => {
        try {
            const { user } = req;
            
            res.json({
                valid: true,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    companyId: user.companyId,
                    roles: user.roles,
                    permissions: user.permissions
                },
                session: {
                    id: user.sessionId,
                    lastActivity: new Date()
                }
            });
            
        } catch (error) {
            logger.error('Token verification failed', {
                component: 'auth-advanced',
                action: 'verify',
                error: error.message,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                error: 'Token verification failed',
                code: 'AUTH_VERIFY_FAILED'
            });
        }
    }
);

/**
 * Get user permissions
 */
router.get('/permissions',
    authenticateAdvanced,
    async (req, res) => {
        try {
            const { permissions, roles } = req.user;
            
            res.json({
                permissions,
                roles
            });
            
        } catch (error) {
            logger.error('Failed to get user permissions', {
                component: 'auth-advanced',
                action: 'getPermissions',
                error: error.message,
                userId: req.user?.userId
            });
            
            res.status(500).json({
                error: 'Failed to get permissions',
                code: 'AUTH_GET_PERMISSIONS_FAILED'
            });
        }
    }
);

export default router;