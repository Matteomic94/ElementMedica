/**
 * JWT Authentication Service
 * Handles JWT token generation, validation, and refresh
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * JWT Service Class
 */
export class JWTService {
    /**
     * Generate access token
     */
    static generateAccessToken(payload) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            issuer: 'training-platform',
            audience: 'training-platform-users'
        });
    }

    /**
     * Generate refresh token
     */
    static generateRefreshToken(payload) {
        return jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: JWT_REFRESH_EXPIRES_IN,
            issuer: 'training-platform',
            audience: 'training-platform-users'
        });
    }

    /**
     * Verify access token
     */
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET, {
                issuer: 'training-platform',
                audience: 'training-platform-users'
            });
        } catch (error) {
            throw new Error(`Invalid access token: ${error.message}`);
        }
    }

    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET, {
                issuer: 'training-platform',
                audience: 'training-platform-users'
            });
        } catch (error) {
            throw new Error(`Invalid refresh token: ${error.message}`);
        }
    }

    /**
     * Generate token pair (access + refresh)
     */
    static async generateTokenPair(user, deviceInfo = {}) {
        const payload = {
            userId: user.id,
            email: user.email,
            companyId: user.company_id,
            roles: user.roles || [],
            permissions: user.permissions || []
        };

        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken({ userId: user.id });
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // Store session in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await prisma.userSession.create({
            data: {
                userId: user.id,
                sessionToken: sessionToken,
                deviceInfo: deviceInfo,
                ipAddress: deviceInfo.ip,
                userAgent: deviceInfo.userAgent,
                expiresAt: expiresAt
            }
        });

        return {
            accessToken,
            refreshToken,
            sessionToken,
            expiresIn: JWT_EXPIRES_IN,
            tokenType: 'Bearer'
        };
    }

    /**
     * Refresh access token
     */
    static async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = this.verifyRefreshToken(refreshToken);
            
            // Check if session exists and is active
            const session = await prisma.userSession.findFirst({
                where: {
                    sessionToken: refreshToken,
                    isActive: true,
                    expiresAt: {
                        gt: new Date()
                    }
                },
                include: {
                    user: {
                        include: {
                            userRoles: {
                                include: {
                                    role: {
                                        include: {
                                            rolePermissions: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!session) {
                throw new Error('Invalid or expired refresh token');
            }

            // Update last activity
            await prisma.userSession.update({
                where: { id: session.id },
                data: { lastActivity: new Date() }
            });

            // Generate new access token
            const user = session.user;
            const roles = user.userRoles.map(ur => ur.role.name);
            const permissions = user.userRoles.flatMap(ur => ur.role.rolePermissions || []);

            const payload = {
                userId: user.id,
                email: user.email,
                companyId: user.company_id,
                roles,
                permissions
            };

            const newAccessToken = this.generateAccessToken(payload);

            return {
                accessToken: newAccessToken,
                expiresIn: JWT_EXPIRES_IN,
                tokenType: 'Bearer'
            };

        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }

    /**
     * Revoke session (logout)
     */
    static async revokeSession(sessionToken) {
        await prisma.userSession.updateMany({
            where: {
                sessionToken: sessionToken,
                isActive: true
            },
            data: {
                isActive: false
            }
        });
    }

    /**
     * Revoke all user sessions
     */
    static async revokeAllUserSessions(userId) {
        await prisma.userSession.updateMany({
            where: {
                userId: userId,
                isActive: true
            },
            data: {
                isActive: false
            }
        });
    }

    /**
     * Clean expired sessions
     */
    static async cleanExpiredSessions() {
        const result = await prisma.userSession.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date()
                }
            }
        });
        logger.info(`Cleaned ${result.count} expired sessions`, { component: 'jwt-manager' });
        return result.count;
    }
}

/**
 * Password Service Class
 */
export class PasswordService {
    /**
     * Hash password
     */
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Verify password
     */
    static async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Generate secure random password
     */
    static generateRandomPassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        return password;
    }

    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];

        if (password.length < minLength) {
            errors.push(`Password must be at least ${minLength} characters long`);
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!hasLowerCase) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!hasNumbers) {
            errors.push('Password must contain at least one number');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    /**
     * Calculate password strength score
     */
    static calculatePasswordStrength(password) {
        let score = 0;
        
        // Length bonus
        score += Math.min(password.length * 2, 20);
        
        // Character variety bonus
        if (/[a-z]/.test(password)) score += 5;
        if (/[A-Z]/.test(password)) score += 5;
        if (/\d/.test(password)) score += 5;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
        
        // Penalty for common patterns
        if (/123|abc|qwe|password/i.test(password)) score -= 10;
        if (/^\d+$/.test(password)) score -= 10;
        if (/^[a-zA-Z]+$/.test(password)) score -= 5;
        
        score = Math.max(0, Math.min(100, score));
        
        if (score < 30) return 'weak';
        if (score < 60) return 'medium';
        if (score < 80) return 'strong';
        return 'very-strong';
    }
}

/**
 * Session cleanup job (should be run periodically)
 */
export async function cleanupExpiredSessions() {
    try {
        const deletedCount = await JWTService.cleanExpiredSessions();
        logger.info('Cleaned up expired sessions', { deletedCount, component: 'jwt-manager' });
        return deletedCount;
    } catch (error) {
        logger.error('Session cleanup failed', { component: 'jwt-manager', error: error.message });
        throw error;
    }
}

// Export default
export default {
    JWTService,
    PasswordService,
    cleanupExpiredSessions
};