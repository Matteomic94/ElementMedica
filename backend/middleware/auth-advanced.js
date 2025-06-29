/**
 * Advanced Authentication Middleware
 * Enhanced JWT authentication with refresh tokens, session management, and security features
 */

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AdvancedJWTService } from '../auth/jwt-advanced.js';
import logger from '../utils/logger.js';
import rateLimit from 'express-rate-limit';
import { RBACService } from './rbac.js';

const prisma = new PrismaClient();

/**
 * Enhanced JWT Authentication Middleware
 */
export async function authenticateAdvanced(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access token required',
                code: 'AUTH_TOKEN_MISSING'
            });
        }
        
        const token = authHeader.substring(7);
        
        // Verify and decode token
        const decoded = await AdvancedJWTService.verifyToken(token, 'access');
        
        if (!decoded.valid) {
            return res.status(401).json({
                error: decoded.error || 'Invalid token',
                code: 'AUTH_TOKEN_INVALID'
            });
        }
        
        const { userId, sessionId } = decoded.payload;
        
        // Check if session is still active
        const session = await prisma.userSession.findUnique({
            where: { id: sessionId },
            include: {
                user: {
                    include: {
                        userRoles: {
                            where: { isActive: true },
                            include: {
                                role: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return res.status(401).json({
                error: 'Session expired or invalid',
                code: 'AUTH_SESSION_INVALID'
            });
        }
        
        const user = session.user;
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'User account inactive',
                code: 'AUTH_USER_INACTIVE'
            });
        }
        
        // Update session activity
        await prisma.userSession.update({
            where: { id: sessionId },
            data: {
                lastActivityAt: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });
        
        // Get user permissions
        const permissions = await RBACService.getUserPermissions(userId);
        const roles = user.userRoles.map(ur => ur.role.name);
        
        // Attach user info to request
        req.user = {
            id: user.id,
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            companyId: user.companyId,
            roles: roles,
            permissions: permissions,
            sessionId: sessionId,
            lastLogin: user.lastLogin
        };
        
        // Log successful authentication
        logger.info('User authenticated successfully', {
            component: 'auth-advanced',
            action: 'authenticate',
            userId: user.id,
            sessionId: sessionId,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        
        next();
        
    } catch (error) {
        logger.error('Authentication error', {
            component: 'auth-advanced',
            action: 'authenticate',
            error: error.message,
            stack: error.stack,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });
        
        res.status(401).json({
            error: 'Authentication failed',
            code: 'AUTH_FAILED'
        });
    }
}

/**
 * Optional Authentication Middleware
 * Authenticates user if token is present, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        
        const token = authHeader.substring(7);
        const decoded = await AdvancedJWTService.verifyToken(token, 'access');
        
        if (decoded.valid) {
            const { userId, sessionId } = decoded.payload;
            
            const session = await prisma.userSession.findUnique({
                where: { id: sessionId },
                include: {
                    user: {
                        include: {
                            userRoles: {
                                where: { isActive: true },
                                include: {
                                    role: true
                                }
                            }
                        }
                    }
                }
            });
            
            if (session && session.isActive && session.expiresAt >= new Date()) {
                const user = session.user;
                
                if (user && user.isActive) {
                    const permissions = await RBACService.getUserPermissions(userId);
                    const roles = user.userRoles.map(ur => ur.role.name);
                    
                    req.user = {
                        id: user.id,
                        userId: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        companyId: user.companyId,
                        roles: roles,
                        permissions: permissions,
                        sessionId: sessionId,
                        lastLogin: user.lastLogin
                    };
                }
            }
        }
        
        next();
        
    } catch (error) {
        logger.warn('Optional authentication failed', {
            component: 'auth-advanced',
            action: 'optionalAuth',
            error: error.message,
            ip: req.ip
        });
        
        next();
    }
}

/**
 * Session Timeout Middleware
 */
export function sessionTimeout(timeoutMinutes = 30) {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.sessionId) {
                return next();
            }
            
            const session = await prisma.userSession.findUnique({
                where: { id: req.user.sessionId }
            });
            
            if (!session) {
                return res.status(401).json({
                    error: 'Session not found',
                    code: 'AUTH_SESSION_NOT_FOUND'
                });
            }
            
            const now = new Date();
            const lastActivity = new Date(session.lastActivityAt);
            const timeoutMs = timeoutMinutes * 60 * 1000;
            
            if (now - lastActivity > timeoutMs) {
                // Deactivate expired session
                await prisma.userSession.update({
                    where: { id: session.id },
                    data: { isActive: false }
                });
                
                logger.info('Session timed out', {
                    component: 'auth-advanced',
                    action: 'sessionTimeout',
                    userId: req.user.id,
                    sessionId: session.id,
                    lastActivity: lastActivity,
                    timeoutMinutes
                });
                
                return res.status(401).json({
                    error: 'Session timed out',
                    code: 'AUTH_SESSION_TIMEOUT'
                });
            }
            
            next();
            
        } catch (error) {
            logger.error('Session timeout check failed', {
                component: 'auth-advanced',
                action: 'sessionTimeout',
                error: error.message,
                userId: req.user?.id
            });
            
            next();
        }
    };
}

/**
 * Rate Limiting for Authentication Endpoints
 */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        error: 'Too many authentication attempts',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip + ':' + (req.body?.email || req.body?.username || 'unknown');
    },
    skip: (req) => {
        // Skip rate limiting for successful authentications
        return req.rateLimit?.remaining > 0;
    },
    // onLimitReached is deprecated in express-rate-limit v7
    // Rate limit exceeded logging is handled by the handler function
});

/**
 * Failed Login Tracking Middleware
 */
export async function trackFailedLogin(req, res, next) {
    const originalSend = res.send;
    
    res.send = function(data) {
        // Check if this was a failed login attempt
        if (res.statusCode === 401 && req.body?.email) {
            trackLoginAttempt(req.body.email, req.ip, false);
        } else if (res.statusCode === 200 && req.body?.email) {
            trackLoginAttempt(req.body.email, req.ip, true);
        }
        
        return originalSend.call(this, data);
    };
    
    next();
}

/**
 * Track login attempts and implement account lockout
 */
async function trackLoginAttempt(email, ip, success) {
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (!user) return;
        
        if (success) {
            // Reset failed attempts on successful login
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                    lastLogin: new Date()
                }
            });
            
            logger.info('Successful login', {
                component: 'auth-advanced',
                action: 'trackLoginAttempt',
                userId: user.id,
                email: email,
                ip: ip
            });
        } else {
            // Increment failed attempts
            const maxAttempts = parseInt(process.env.FAILED_LOGIN_ATTEMPTS) || 5;
            const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 30;
            
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            const updateData = {
                failedLoginAttempts: newFailedAttempts
            };
            
            if (newFailedAttempts >= maxAttempts) {
                updateData.lockedUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
                
                logger.warn('Account locked due to failed login attempts', {
                    component: 'auth-advanced',
                    action: 'trackLoginAttempt',
                    userId: user.id,
                    email: email,
                    ip: ip,
                    failedAttempts: newFailedAttempts,
                    lockoutDuration: lockoutDuration
                });
            }
            
            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            });
            
            logger.warn('Failed login attempt', {
                component: 'auth-advanced',
                action: 'trackLoginAttempt',
                userId: user.id,
                email: email,
                ip: ip,
                failedAttempts: newFailedAttempts
            });
        }
        
    } catch (error) {
        logger.error('Failed to track login attempt', {
            component: 'auth-advanced',
            action: 'trackLoginAttempt',
            error: error.message,
            email: email,
            ip: ip
        });
    }
}

/**
 * Check if account is locked
 */
export async function checkAccountLock(req, res, next) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return next();
        }
        
        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (!user) {
            return next();
        }
        
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.lockedUntil - new Date()) / (1000 * 60));
            
            logger.warn('Login attempt on locked account', {
                component: 'auth-advanced',
                action: 'checkAccountLock',
                userId: user.id,
                email: email,
                ip: req.ip,
                remainingLockTime: remainingTime
            });
            
            return res.status(423).json({
                error: 'Account temporarily locked',
                code: 'AUTH_ACCOUNT_LOCKED',
                remainingTime: remainingTime,
                message: `Account locked for ${remainingTime} more minutes`
            });
        }
        
        next();
        
    } catch (error) {
        logger.error('Account lock check failed', {
            component: 'auth-advanced',
            action: 'checkAccountLock',
            error: error.message,
            email: req.body?.email
        });
        
        next();
    }
}

/**
 * Device Fingerprinting Middleware
 */
export function deviceFingerprint(req, res, next) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    // Create a simple device fingerprint
    const fingerprint = Buffer.from(
        `${userAgent}:${acceptLanguage}:${acceptEncoding}:${req.ip}`
    ).toString('base64');
    
    req.deviceFingerprint = fingerprint;
    
    next();
}

/**
 * Concurrent Session Limit Middleware
 */
export function limitConcurrentSessions(maxSessions = 3) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next();
            }
            
            const activeSessions = await prisma.userSession.count({
                where: {
                    userId: req.user.id,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });
            
            if (activeSessions > maxSessions) {
                // Deactivate oldest sessions
                const oldestSessions = await prisma.userSession.findMany({
                    where: {
                        userId: req.user.id,
                        isActive: true,
                        expiresAt: {
                            gt: new Date()
                        }
                    },
                    orderBy: {
                        lastActivityAt: 'asc'
                    },
                    take: activeSessions - maxSessions
                });
                
                await prisma.userSession.updateMany({
                    where: {
                        id: {
                            in: oldestSessions.map(s => s.id)
                        }
                    },
                    data: {
                        isActive: false
                    }
                });
                
                logger.info('Deactivated old sessions due to concurrent limit', {
                    component: 'auth-advanced',
                    action: 'limitConcurrentSessions',
                    userId: req.user.id,
                    deactivatedSessions: oldestSessions.length,
                    maxSessions
                });
            }
            
            next();
            
        } catch (error) {
            logger.error('Concurrent session limit check failed', {
                component: 'auth-advanced',
                action: 'limitConcurrentSessions',
                error: error.message,
                userId: req.user?.id
            });
            
            next();
        }
    };
}

export default {
    authenticateAdvanced,
    optionalAuth,
    sessionTimeout,
    authRateLimit,
    trackFailedLogin,
    checkAccountLock,
    deviceFingerprint,
    limitConcurrentSessions
};