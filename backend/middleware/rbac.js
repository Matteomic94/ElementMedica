/**
 * Role-Based Access Control (RBAC) Middleware
 * Advanced authorization system with granular permissions
 */

import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * RBAC Service Class
 */
export class RBACService {
    /**
     * Check if user has specific permission
     */
    static async hasPermission(userId, permission, resourceId = null) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        where: { 
                            isActive: true,
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } }
                            ]
                        },
                        include: {
                            role: true
                        }
                    }
                }
            });
            
            if (!user || !user.isActive) {
                return false;
            }
            
            // Check for global admin role
            const hasGlobalAdmin = user.userRoles.some(ur => ur.role.name === 'global_admin');
            if (hasGlobalAdmin) {
                return true;
            }
            
            // Check specific permissions
            for (const userRole of user.userRoles) {
                const rolePermissions = this.getRolePermissions(userRole.role);
                
                // Check for wildcard permission
                if (rolePermissions.includes('*')) {
                    return true;
                }
                
                // Check exact permission match
                if (rolePermissions.includes(permission)) {
                    return true;
                }
                
                // Check wildcard patterns (e.g., 'users.*' matches 'users.read')
                const hasWildcardMatch = rolePermissions.some(perm => {
                    if (perm.endsWith('*')) {
                        const prefix = perm.slice(0, -1);
                        return permission.startsWith(prefix);
                    }
                    return false;
                });
                
                if (hasWildcardMatch) {
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            logger.error('Permission check failed', {
                component: 'rbac-service',
                action: 'hasPermission',
                error: error.message,
                userId,
                permission,
                resourceId
            });
            return false;
        }
    }
    
    /**
     * Check if user has any of the specified roles
     */
    static async hasRole(userId, roles) {
        try {
            const userRoles = await prisma.userRole.findMany({
                where: {
                    userId: userId,
                    isActive: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                },
                include: {
                    role: true
                }
            });
            
            const userRoleNames = userRoles.map(ur => ur.role.name);
            const requiredRoles = Array.isArray(roles) ? roles : [roles];
            
            return requiredRoles.some(role => userRoleNames.includes(role));
            
        } catch (error) {
            logger.error('Role check failed', {
                component: 'rbac-service',
                action: 'hasRole',
                error: error.message,
                userId,
                roles
            });
            return false;
        }
    }
    
    /**
     * Get user's effective permissions
     */
    static async getUserPermissions(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        where: { 
                            isActive: true,
                            OR: [
                                { expiresAt: null },
                                { expiresAt: { gt: new Date() } }
                            ]
                        },
                        include: {
                            role: true
                        }
                    }
                }
            });
            
            if (!user) {
                return [];
            }
            
            const permissions = new Set();
            
            user.userRoles.forEach(userRole => {
                const rolePermissions = this.getRolePermissions(userRole.role);
                rolePermissions.forEach(permission => permissions.add(permission));
            });
            
            return Array.from(permissions);
            
        } catch (error) {
            logger.error('Failed to get user permissions', {
                component: 'rbac-service',
                action: 'getUserPermissions',
                error: error.message,
                userId
            });
            return [];
        }
    }
    
    /**
     * Get permissions from role object
     */
    static getRolePermissions(role) {
        if (!role.permissions) {
            return [];
        }
        
        try {
            return Array.isArray(role.permissions) 
                ? role.permissions 
                : JSON.parse(role.permissions);
        } catch (error) {
            logger.error('Failed to parse role permissions', {
                component: 'rbac-service',
                action: 'getRolePermissions',
                error: error.message,
                roleId: role.id
            });
            return [];
        }
    }
    
    /**
     * Check company isolation
     */
    static async checkCompanyAccess(userId, targetCompanyId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        where: { isActive: true },
                        include: {
                            role: true
                        }
                    }
                }
            });
            
            if (!user) {
                return false;
            }
            
            // Global admin can access any company
            const hasGlobalAdmin = user.userRoles.some(ur => ur.role.name === 'global_admin');
            if (hasGlobalAdmin) {
                return true;
            }
            
            // Check if user belongs to the target company
            return user.companyId === targetCompanyId;
            
        } catch (error) {
            logger.error('Company access check failed', {
                component: 'rbac-service',
                action: 'checkCompanyAccess',
                error: error.message,
                userId,
                targetCompanyId
            });
            return false;
        }
    }
}

/**
 * Middleware: Require specific permissions
 */
export function requirePermissions(permissions, options = {}) {
    const { requireAll = false, allowSuperAdmin = true } = options;
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }
            
            const userId = req.user.userId || req.user.id;
            
            // Check if user has required permissions
            const permissionChecks = await Promise.all(
                requiredPermissions.map(permission => 
                    RBACService.hasPermission(userId, permission)
                )
            );
            
            const hasPermission = requireAll 
                ? permissionChecks.every(check => check)
                : permissionChecks.some(check => check);
            
            if (!hasPermission) {
                // Log unauthorized access attempt
                logger.warn('Unauthorized access attempt', {
                    component: 'rbac-middleware',
                    action: 'requirePermissions',
                    userId: userId,
                    requiredPermissions,
                    userPermissions: req.user.permissions || [],
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    required: requiredPermissions,
                    current: req.user.permissions || []
                });
            }
            
            next();
            
        } catch (error) {
            logger.error('Permission middleware error', {
                component: 'rbac-middleware',
                action: 'requirePermissions',
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId || req.user?.id
            });
            
            res.status(500).json({
                error: 'Authorization check failed',
                code: 'AUTH_CHECK_FAILED'
            });
        }
    };
}

/**
 * Middleware: Require specific roles
 */
export function requireRoles(roles, options = {}) {
    const { requireAll = false } = options;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }
            
            const userId = req.user.userId || req.user.id;
            
            // Check if user has required roles
            const roleChecks = await Promise.all(
                requiredRoles.map(role => 
                    RBACService.hasRole(userId, role)
                )
            );
            
            const hasRole = requireAll 
                ? roleChecks.every(check => check)
                : roleChecks.some(check => check);
            
            if (!hasRole) {
                logger.warn('Unauthorized role access attempt', {
                    component: 'rbac-middleware',
                    action: 'requireRoles',
                    userId: userId,
                    requiredRoles,
                    userRoles: req.user.roles || [],
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                
                return res.status(403).json({
                    error: 'Insufficient role privileges',
                    code: 'AUTH_INSUFFICIENT_ROLE',
                    required: requiredRoles,
                    current: req.user.roles || []
                });
            }
            
            next();
            
        } catch (error) {
            logger.error('Role middleware error', {
                component: 'rbac-middleware',
                action: 'requireRoles',
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId || req.user?.id
            });
            
            res.status(500).json({
                error: 'Role check failed',
                code: 'ROLE_CHECK_FAILED'
            });
        }
    };
}

/**
 * Middleware: Company isolation
 */
export function requireCompanyAccess(options = {}) {
    const { 
        paramName = 'companyId',
        bodyField = 'companyId',
        queryField = 'companyId',
        allowGlobalAdmin = true 
    } = options;
    
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }
            
            const userId = req.user.userId || req.user.id;
            const targetCompanyId = req.params[paramName] || 
                                  req.body[bodyField] || 
                                  req.query[queryField];
            
            if (!targetCompanyId) {
                // If no company ID specified, use user's company
                const userCompanyId = req.user.companyId;
                if (userCompanyId) {
                    req.params[paramName] = userCompanyId;
                    req.query[queryField] = userCompanyId;
                    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
                        req.body[bodyField] = userCompanyId;
                    }
                }
                return next();
            }
            
            // Check company access
            const hasAccess = await RBACService.checkCompanyAccess(userId, targetCompanyId);
            
            if (!hasAccess) {
                logger.warn('Company isolation violation', {
                    component: 'rbac-middleware',
                    action: 'requireCompanyAccess',
                    userId: userId,
                    userCompanyId: req.user.companyId,
                    targetCompanyId: targetCompanyId,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                
                return res.status(403).json({
                    error: 'Access denied: Company isolation violation',
                    code: 'AUTH_COMPANY_ISOLATION_VIOLATION'
                });
            }
            
            next();
            
        } catch (error) {
            logger.error('Company access middleware error', {
                component: 'rbac-middleware',
                action: 'requireCompanyAccess',
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId || req.user?.id
            });
            
            res.status(500).json({
                error: 'Company access check failed',
                code: 'COMPANY_ACCESS_CHECK_FAILED'
            });
        }
    };
}

/**
 * Middleware: Resource ownership check
 */
export function requireOwnership(resourceModel, options = {}) {
    const {
        userIdField = 'userId',
        paramName = 'id',
        allowCompanyAdmin = true,
        allowGlobalAdmin = true
    } = options;
    
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }
            
            const userId = req.user.userId || req.user.id;
            const resourceId = req.params[paramName];
            
            if (!resourceId) {
                return res.status(400).json({
                    error: 'Resource ID required',
                    code: 'RESOURCE_ID_MISSING'
                });
            }
            
            // Check if user has admin privileges
            if (allowGlobalAdmin && req.user.roles?.includes('global_admin')) {
                return next();
            }
            
            if (allowCompanyAdmin && req.user.roles?.includes('company_admin')) {
                return next();
            }
            
            // Check resource ownership
            const resource = await prisma[resourceModel].findUnique({
                where: { id: resourceId }
            });
            
            if (!resource) {
                return res.status(404).json({
                    error: 'Resource not found',
                    code: 'RESOURCE_NOT_FOUND'
                });
            }
            
            if (resource[userIdField] !== userId) {
                logger.warn('Resource ownership violation', {
                    component: 'rbac-middleware',
                    action: 'requireOwnership',
                    userId: userId,
                    resourceId: resourceId,
                    resourceModel: resourceModel,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                
                return res.status(403).json({
                    error: 'Access denied: Resource ownership violation',
                    code: 'AUTH_OWNERSHIP_VIOLATION'
                });
            }
            
            next();
            
        } catch (error) {
            logger.error('Ownership middleware error', {
                component: 'rbac-middleware',
                action: 'requireOwnership',
                error: error.message,
                stack: error.stack,
                userId: req.user?.userId || req.user?.id,
                resourceId: req.params?.[paramName]
            });
            
            res.status(500).json({
                error: 'Ownership check failed',
                code: 'OWNERSHIP_CHECK_FAILED'
            });
        }
    };
}

export default {
    RBACService,
    requirePermissions,
    requireRoles,
    requireCompanyAccess,
    requireOwnership
};