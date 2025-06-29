/**
 * Advanced JWT Service with Refresh Token Support
 * Implements token rotation, blacklist, and session management
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const JWT_REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';
const MAX_CONCURRENT_SESSIONS = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5;

/**
 * Advanced JWT Service Class
 */
export class AdvancedJWTService {
    /**
     * Generate access and refresh token pair
     */
    static async generateTokenPair(user, deviceInfo = {}) {
        try {
            // Clean up expired sessions first
            await this.cleanupExpiredSessions(user.id);
            
            // Check concurrent session limit
            const activeSessions = await prisma.refreshToken.count({
                where: {
                    userId: user.id,
                    revokedAt: null,
                    expiresAt: {
                        gt: new Date()
                    }
                }
            });
            
            if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
                // Revoke oldest session
                const oldestSession = await prisma.refreshToken.findFirst({
                    where: {
                        userId: user.id,
                        revokedAt: null
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                });
                
                if (oldestSession) {
                    await this.revokeRefreshToken(oldestSession.token);
                }
            }
            
            // Generate access token
            const accessTokenPayload = {
                userId: user.id,
                email: user.email,
                username: user.username,
                companyId: user.companyId,
                sessionId: crypto.randomUUID()
            };
            
            const accessToken = jwt.sign(
                accessTokenPayload,
                JWT_SECRET,
                { 
                    expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
                    issuer: 'project-auth-system',
                    audience: 'project-api'
                }
            );
            
            // Generate refresh token
            const refreshTokenValue = crypto.randomBytes(64).toString('hex');
            const refreshTokenExpiry = new Date();
            refreshTokenExpiry.setTime(refreshTokenExpiry.getTime() + this.parseExpiry(JWT_REFRESH_TOKEN_EXPIRY));
            
            // Store refresh token in database
            const refreshToken = await prisma.refreshToken.create({
                data: {
                    userId: user.id,
                    token: refreshTokenValue,
                    expiresAt: refreshTokenExpiry,
                    deviceInfo: deviceInfo
                }
            });
            
            // Create user session record
            await prisma.userSession.create({
                data: {
                    userId: user.id,
                    sessionToken: accessTokenPayload.sessionId,
                    deviceInfo: deviceInfo,
                    ipAddress: deviceInfo.ipAddress,
                    userAgent: deviceInfo.userAgent,
                    expiresAt: new Date(Date.now() + this.parseExpiry(JWT_ACCESS_TOKEN_EXPIRY))
                }
            });
            
            logger.info('Token pair generated successfully', {
                component: 'jwt-advanced',
                action: 'generateTokenPair',
                userId: user.id,
                sessionId: accessTokenPayload.sessionId
            });
            
            return {
                accessToken,
                refreshToken: refreshTokenValue,
                expiresIn: this.parseExpiry(JWT_ACCESS_TOKEN_EXPIRY) / 1000,
                tokenType: 'Bearer'
            };
            
        } catch (error) {
            logger.error('Failed to generate token pair', {
                component: 'jwt-advanced',
                action: 'generateTokenPair',
                error: error.message,
                stack: error.stack,
                userId: user?.id
            });
            throw new Error('Token generation failed');
        }
    }
    
    /**
     * Refresh access token using refresh token
     */
    static async refreshAccessToken(refreshTokenValue, deviceInfo = {}) {
        try {
            // Find and validate refresh token
            const refreshToken = await prisma.refreshToken.findUnique({
                where: { token: refreshTokenValue },
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
            
            if (!refreshToken || refreshToken.revokedAt || refreshToken.expiresAt < new Date()) {
                throw new Error('Invalid or expired refresh token');
            }
            
            const user = refreshToken.user;
            
            if (!user.isActive) {
                throw new Error('User account is inactive');
            }
            
            // Generate new access token
            const accessTokenPayload = {
                userId: user.id,
                email: user.email,
                username: user.username,
                companyId: user.companyId,
                roles: user.userRoles.map(ur => ur.role.name),
                permissions: this.aggregatePermissions(user.userRoles),
                sessionId: crypto.randomUUID()
            };
            
            const accessToken = jwt.sign(
                accessTokenPayload,
                JWT_SECRET,
                { 
                    expiresIn: JWT_ACCESS_TOKEN_EXPIRY,
                    issuer: 'project-auth-system',
                    audience: 'project-api'
                }
            );
            
            // Update user session
            await prisma.userSession.upsert({
                where: {
                    sessionToken: accessTokenPayload.sessionId
                },
                create: {
                    userId: user.id,
                    sessionToken: accessTokenPayload.sessionId,
                    deviceInfo: deviceInfo,
                    ipAddress: deviceInfo.ipAddress,
                    userAgent: deviceInfo.userAgent,
                    expiresAt: new Date(Date.now() + this.parseExpiry(JWT_ACCESS_TOKEN_EXPIRY))
                },
                update: {
                    lastActivity: new Date(),
                    ipAddress: deviceInfo.ipAddress,
                    userAgent: deviceInfo.userAgent
                }
            });
            
            // Update user last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });
            
            logger.info('Access token refreshed successfully', {
                component: 'jwt-advanced',
                action: 'refreshAccessToken',
                userId: user.id,
                sessionId: accessTokenPayload.sessionId
            });
            
            return {
                accessToken,
                expiresIn: this.parseExpiry(JWT_ACCESS_TOKEN_EXPIRY) / 1000,
                tokenType: 'Bearer'
            };
            
        } catch (error) {
            logger.error('Failed to refresh access token', {
                component: 'jwt-advanced',
                action: 'refreshAccessToken',
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Verify access token
     */
    static async verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET, {
                issuer: 'project-auth-system',
                audience: 'project-api'
            });
            
            // Check if session is still active
            const session = await prisma.userSession.findUnique({
                where: { sessionToken: decoded.sessionId },
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
                throw new Error('Session expired or invalid');
            }
            
            if (!session.user.isActive) {
                throw new Error('User account is inactive');
            }
            
            // Update last activity
            await prisma.userSession.update({
                where: { sessionToken: decoded.sessionId },
                data: { lastActivity: new Date() }
            });
            
            return {
                ...decoded,
                roles: session.user.userRoles.map(ur => ur.role.name),
                permissions: this.aggregatePermissions(session.user.userRoles)
            };
            
        } catch (error) {
            logger.error('Token verification failed', {
                component: 'jwt-advanced',
                action: 'verifyAccessToken',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Revoke refresh token
     */
    static async revokeRefreshToken(refreshTokenValue) {
        try {
            await prisma.refreshToken.update({
                where: { token: refreshTokenValue },
                data: { revokedAt: new Date() }
            });
            
            logger.info('Refresh token revoked', {
                component: 'jwt-advanced',
                action: 'revokeRefreshToken'
            });
            
        } catch (error) {
            logger.error('Failed to revoke refresh token', {
                component: 'jwt-advanced',
                action: 'revokeRefreshToken',
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Revoke all user sessions
     */
    static async revokeAllUserSessions(userId) {
        try {
            // Revoke all refresh tokens
            await prisma.refreshToken.updateMany({
                where: {
                    userId: userId,
                    revokedAt: null
                },
                data: { revokedAt: new Date() }
            });
            
            // Deactivate all user sessions
            await prisma.userSession.updateMany({
                where: {
                    userId: userId,
                    isActive: true
                },
                data: { isActive: false }
            });
            
            logger.info('All user sessions revoked', {
                component: 'jwt-advanced',
                action: 'revokeAllUserSessions',
                userId: userId
            });
            
        } catch (error) {
            logger.error('Failed to revoke all user sessions', {
                component: 'jwt-advanced',
                action: 'revokeAllUserSessions',
                error: error.message,
                userId: userId
            });
            throw error;
        }
    }
    
    /**
     * Get user active sessions
     */
    static async getUserSessions(userId) {
        try {
            const sessions = await prisma.userSession.findMany({
                where: {
                    userId: userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                orderBy: {
                    lastActivity: 'desc'
                }
            });
            
            return sessions.map(session => ({
                id: session.id,
                deviceInfo: session.deviceInfo,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                lastActivity: session.lastActivity,
                createdAt: session.createdAt
            }));
            
        } catch (error) {
            logger.error('Failed to get user sessions', {
                component: 'jwt-advanced',
                action: 'getUserSessions',
                error: error.message,
                userId: userId
            });
            throw error;
        }
    }
    
    /**
     * Cleanup expired sessions
     */
    static async cleanupExpiredSessions(userId = null) {
        try {
            const where = {
                expiresAt: {
                    lt: new Date()
                }
            };
            
            if (userId) {
                where.userId = userId;
            }
            
            // Remove expired refresh tokens
            await prisma.refreshToken.deleteMany({ where });
            
            // Deactivate expired user sessions
            await prisma.userSession.updateMany({
                where,
                data: { isActive: false }
            });
            
            logger.info('Expired sessions cleaned up', {
                component: 'jwt-advanced',
                action: 'cleanupExpiredSessions',
                userId: userId
            });
            
        } catch (error) {
            logger.error('Failed to cleanup expired sessions', {
                component: 'jwt-advanced',
                action: 'cleanupExpiredSessions',
                error: error.message,
                userId: userId
            });
        }
    }
    
    /**
     * Parse expiry string to milliseconds
     */
    static parseExpiry(expiry) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };
        
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error('Invalid expiry format');
        }
        
        const [, value, unit] = match;
        return parseInt(value) * units[unit];
    }
    
    /**
     * Aggregate permissions from user roles
     */
    static aggregatePermissions(userRoles) {
        const permissions = new Set();
        
        userRoles.forEach(userRole => {
            if (userRole.role.permissions) {
                const rolePermissions = Array.isArray(userRole.role.permissions) 
                    ? userRole.role.permissions 
                    : JSON.parse(userRole.role.permissions || '[]');
                    
                rolePermissions.forEach(permission => permissions.add(permission));
            }
        });
        
        return Array.from(permissions);
    }
}

// Start cleanup interval
setInterval(() => {
    AdvancedJWTService.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Run every hour

export default AdvancedJWTService;