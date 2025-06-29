/**
 * User Management Controller
 * Handles CRUD operations for users, roles, and permissions
 */

import { PrismaClient } from '@prisma/client';
import { PasswordService } from './jwt.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

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
 * Get paginated list of users
 * GET /api/users
 */
export const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            companyId,
            role,
            isActive,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build where clause
        const where = {};
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.company_id = req.user.companyId;
        } else if (companyId) {
            where.company_id = companyId;
        }
        
        // Search filter
        if (search) {
            where.OR = [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // Active filter
        if (isActive !== undefined) {
            where.is_active = isActive === 'true';
        }
        
        // Role filter
        if (role) {
            where.user_roles = {
                some: {
                    role: {
                        name: role
                    },
                    is_active: true
                }
            };
        }

        // Get users with pagination
        const [users, total] = await Promise.all([
            prisma.users.findMany({
                where,
                include: {
                    user_roles: {
                        where: { is_active: true },
                        include: {
                            role: {
                                select: {
                                    id: true,
                                    name: true,
                                    display_name: true
                                }
                            }
                        }
                    },
                    company: {
                        select: {
                            id: true,
                            nome: true
                        }
                    },
                    employee: {
                        select: {
                            id: true,
                            nome: true,
                            cognome: true
                        }
                    }
                },
                orderBy: {
                    [sortBy]: sortOrder
                },
                skip: offset,
                take: parseInt(limit)
            }),
            prisma.users.count({ where })
        ]);

        // Format response
        const formattedUsers = users.map(user => ({
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
            roles: user.user_roles.map(ur => ur.role),
            isActive: user.is_active,
            isVerified: user.is_verified,
            lastLogin: user.last_login_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        }));

        res.json({
            success: true,
            data: formattedUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        logger.error('Failed to fetch users', {
            component: 'user-controller',
            action: 'getUsers',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            companyId: req.query?.companyId
        });
        res.status(500).json({
            error: 'Failed to get users',
            code: 'USER_GET_FAILED'
        });
    }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const where = { id };
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.company_id = req.user.companyId;
        }

        const user = await prisma.users.findFirst({
            where,
            include: {
                user_roles: {
                    where: { is_active: true },
                    include: {
                        role: {
                            select: {
                                id: true,
                                name: true,
                                display_name: true,
                                rolePermissions: true
                            }
                        }
                    }
                },
                company: true,
                employee: true,
                user_preferences: true
            }
        });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const roles = user.user_roles.map(ur => ur.role);
        const permissions = user.user_roles.flatMap(ur => ur.role.permissions || []);

        res.json({
            success: true,
            data: {
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
                preferences: user.user_preferences,
                isActive: user.is_active,
                isVerified: user.is_verified,
                lastLogin: user.last_login_at,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });

    } catch (error) {
        logger.error('Failed to fetch user', {
            component: 'user-controller',
            action: 'getUser',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.id
        });
        res.status(500).json({
            error: 'Failed to get user',
            code: 'USER_GET_FAILED'
        });
    }
};

/**
 * Create new user
 * POST /api/users
 */
export const createUser = [
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }),
        body('firstName').isLength({ min: 1 }).trim(),
        body('lastName').isLength({ min: 1 }).trim(),
        body('companyId').isUUID().optional(),
        body('employeeId').isUUID().optional(),
        body('roles').isArray().optional(),
        body('phone').isMobilePhone().optional(),
        body('language').isIn(['it', 'en']).optional()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const {
                email,
                password,
                firstName,
                lastName,
                companyId,
                employeeId,
                roles = ['employee'],
                phone,
                language = 'it'
            } = req.body;

            // Validate password strength
            const passwordValidation = PasswordService.validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    error: 'Password does not meet requirements',
                    code: 'WEAK_PASSWORD',
                    details: passwordValidation.errors
                });
            }

            // Check if user already exists
            const existingUser = await prisma.users.findUnique({
                where: { email }
            });

            if (existingUser) {
                return res.status(409).json({
                    error: 'User already exists',
                    code: 'USER_EXISTS'
                });
            }

            // Use requester's company if not specified (unless global admin)
            const targetCompanyId = companyId || 
                (req.user.roles.includes('global_admin') ? null : req.user.companyId);

            // Validate employee belongs to target company
            if (employeeId && targetCompanyId) {
                const employee = await prisma.employee.findFirst({
                    where: {
                        id: employeeId,
                        company_id: targetCompanyId
                    }
                });

                if (!employee) {
                    return res.status(400).json({
                        error: 'Employee not found in target company',
                        code: 'EMPLOYEE_NOT_FOUND'
                    });
                }
            }

            // Hash password
            const passwordHash = await PasswordService.hashPassword(password);

            // Create user in transaction
            const result = await prisma.$transaction(async (tx) => {
                // Create user
                const user = await tx.users.create({
                    data: {
                        email,
                        password_hash: passwordHash,
                        first_name: firstName,
                        last_name: lastName,
                        phone,
                        language,
                        company_id: targetCompanyId,
                        employee_id: employeeId,
                        created_by: req.user.id
                    }
                });

                // Assign roles
                const userRoles = [];
                for (const roleName of roles) {
                    const role = await tx.roles.findFirst({
                        where: {
                            name: roleName,
                            OR: [
                                { is_system_role: true },
                                { company_id: targetCompanyId }
                            ]
                        }
                    });

                    if (role) {
                        const userRole = await tx.user_roles.create({
                            data: {
                                user_id: user.id,
                                role_id: role.id,
                                company_id: targetCompanyId,
                                assigned_by: req.user.id
                            },
                            include: {
                                role: true
                            }
                        });
                        userRoles.push(userRole.role);
                    }
                }

                return { user, roles: userRoles };
            });

            res.status(201).json({
                success: true,
                data: {
                    id: result.user.id,
                    email: result.user.email,
                    firstName: result.user.first_name,
                    lastName: result.user.last_name,
                    phone: result.user.phone,
                    language: result.user.language,
                    companyId: result.user.company_id,
                    employeeId: result.user.employee_id,
                    roles: result.roles,
                    isActive: result.user.is_active,
                    createdAt: result.user.created_at
                }
            });

        } catch (error) {
            logger.error('Failed to create user', {
            component: 'user-controller',
            action: 'createUser',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            email: req.body?.email
        });
            res.status(500).json({
                error: 'Failed to create user',
                code: 'USER_CREATE_FAILED'
            });
        }
    }
];

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = [
    [
        body('firstName').optional().isLength({ min: 1 }).trim(),
        body('lastName').optional().isLength({ min: 1 }).trim(),
        body('phone').optional().isMobilePhone(),
        body('language').optional().isIn(['it', 'en']),
        body('timezone').optional().isLength({ min: 1 }),
        body('employeeId').optional().isUUID(),
        body('isActive').optional().isBoolean()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                firstName,
                lastName,
                phone,
                language,
                timezone,
                employeeId,
                isActive
            } = req.body;

            const where = { id };
            
            // Company isolation for non-global admins
            if (!req.user.roles.includes('global_admin')) {
                where.company_id = req.user.companyId;
            }

            // Check if user exists
            const existingUser = await prisma.users.findFirst({ where });
            if (!existingUser) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Validate employee belongs to user's company
            if (employeeId) {
                const employee = await prisma.employee.findFirst({
                    where: {
                        id: employeeId,
                        company_id: existingUser.company_id
                    }
                });

                if (!employee) {
                    return res.status(400).json({
                        error: 'Employee not found in user company',
                        code: 'EMPLOYEE_NOT_FOUND'
                    });
                }
            }

            // Build update data
            const updateData = { updated_by: req.user.id };
            if (firstName !== undefined) updateData.first_name = firstName;
            if (lastName !== undefined) updateData.last_name = lastName;
            if (phone !== undefined) updateData.phone = phone;
            if (language !== undefined) updateData.language = language;
            if (timezone !== undefined) updateData.timezone = timezone;
            if (employeeId !== undefined) updateData.employee_id = employeeId;
            if (isActive !== undefined) updateData.is_active = isActive;

            // Update user
            const user = await prisma.users.update({
                where: { id },
                data: updateData,
                include: {
                    user_roles: {
                        where: { is_active: true },
                        include: {
                            role: true
                        }
                    },
                    company: true,
                    employee: true
                }
            });

            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    language: user.language,
                    timezone: user.timezone,
                    companyId: user.company_id,
                    employeeId: user.employee_id,
                    company: user.company,
                    employee: user.employee,
                    roles: user.user_roles.map(ur => ur.role),
                    isActive: user.is_active,
                    updatedAt: user.updated_at
                }
            });

        } catch (error) {
            logger.error('Failed to update user', {
            component: 'user-controller',
            action: 'updateUser',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.id
        });
            res.status(500).json({
                error: 'Failed to update user',
                code: 'USER_UPDATE_FAILED'
            });
        }
    }
];

/**
 * Delete user (soft delete)
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const where = { id };
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.company_id = req.user.companyId;
        }

        // Check if user exists
        const existingUser = await prisma.users.findFirst({ where });
        if (!existingUser) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({
                error: 'Cannot delete your own account',
                code: 'SELF_DELETE_FORBIDDEN'
            });
        }

        // Soft delete user and deactivate roles
        await prisma.$transaction(async (tx) => {
            // Deactivate user
            await tx.users.update({
                where: { id },
                data: {
                    isActive: false,
                    eliminato: true
                }
            });

            // Deactivate user roles
            await tx.user_roles.updateMany({
                where: { user_id: id },
                data: { is_active: false }
            });

            // Deactivate user sessions
            await tx.user_sessions.updateMany({
                where: { user_id: id },
                data: { is_active: false }
            });
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        logger.error('Failed to delete user', {
            component: 'user-controller',
            action: 'deleteUser',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.id
        });
        res.status(500).json({
            error: 'Failed to delete user',
            code: 'USER_DELETE_FAILED'
        });
    }
};

/**
 * Assign role to user
 * POST /api/users/:id/roles
 */
export const assignRole = [
    [
        body('roleId').isUUID(),
        body('companyId').isUUID().optional()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { roleId, companyId } = req.body;

            const where = { id };
            
            // Company isolation for non-global admins
            if (!req.user.roles.includes('global_admin')) {
                where.company_id = req.user.companyId;
            }

            // Check if user exists
            const user = await prisma.users.findFirst({ where });
            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Use user's company if not specified
            const targetCompanyId = companyId || user.company_id;

            // Check if role exists and is accessible
            const role = await prisma.roles.findFirst({
                where: {
                    id: roleId,
                    OR: [
                        { is_system_role: true },
                        { company_id: targetCompanyId }
                    ]
                }
            });

            if (!role) {
                return res.status(404).json({
                    error: 'Role not found',
                    code: 'ROLE_NOT_FOUND'
                });
            }

            // Check if user already has this role
            const existingUserRole = await prisma.user_roles.findFirst({
                where: {
                    user_id: id,
                    role_id: roleId,
                    company_id: targetCompanyId,
                    is_active: true
                }
            });

            if (existingUserRole) {
                return res.status(409).json({
                    error: 'User already has this role',
                    code: 'ROLE_ALREADY_ASSIGNED'
                });
            }

            // Assign role
            const userRole = await prisma.user_roles.create({
                data: {
                    user_id: id,
                    role_id: roleId,
                    company_id: targetCompanyId,
                    assigned_by: req.user.id
                },
                include: {
                    role: true
                }
            });

            res.status(201).json({
                success: true,
                data: {
                    id: userRole.id,
                    role: userRole.role,
                    companyId: userRole.company_id,
                    assignedAt: userRole.assigned_at
                }
            });

        } catch (error) {
            logger.error('Failed to assign role', {
            component: 'user-controller',
            action: 'assignRole',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.userId,
            roleId: req.body?.roleId
        });
            res.status(500).json({
                error: 'Failed to assign role',
                code: 'ROLE_ASSIGN_FAILED'
            });
        }
    }
];

/**
 * Remove role from user
 * DELETE /api/users/:id/roles/:roleId
 */
export const removeRole = async (req, res) => {
    try {
        const { id, roleId } = req.params;

        const where = { id };
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.company_id = req.user.companyId;
        }

        // Check if user exists
        const user = await prisma.users.findFirst({ where });
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Find and deactivate user role
        const userRole = await prisma.user_roles.findFirst({
            where: {
                user_id: id,
                role_id: roleId,
                is_active: true
            }
        });

        if (!userRole) {
            return res.status(404).json({
                error: 'User role not found',
                code: 'USER_ROLE_NOT_FOUND'
            });
        }

        // Deactivate role
        await prisma.user_roles.update({
            where: { id: userRole.id },
            data: {
                is_active: false,
                removed_at: new Date(),
                removed_by: req.user.id
            }
        });

        res.json({
            success: true,
            message: 'Role removed successfully'
        });

    } catch (error) {
        logger.error('Failed to remove role', {
            component: 'user-controller',
            action: 'removeRole',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.userId,
            roleId: req.params?.roleId
        });
        res.status(500).json({
            error: 'Failed to remove role',
            code: 'ROLE_REMOVE_FAILED'
        });
    }
};

/**
 * Get user's roles
 * GET /api/users/:id/roles
 */
export const getUserRoles = async (req, res) => {
    try {
        const { id } = req.params;
        
        const where = { id };
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.company_id = req.user.companyId;
        }

        // Check if user exists
        const user = await prisma.users.findFirst({ where });
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Get user roles
        const userRoles = await prisma.user_roles.findMany({
            where: {
                user_id: id,
                is_active: true
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true,
                        display_name: true,
                        description: true,
                        rolePermissions: true,
                        is_system_role: true
                    }
                }
            },
            orderBy: {
                assigned_at: 'desc'
            }
        });

        res.json({
            success: true,
            data: userRoles.map(ur => ({
                id: ur.id,
                role: ur.role,
                companyId: ur.company_id,
                assignedAt: ur.assigned_at,
                assignedBy: ur.assigned_by
            }))
        });

    } catch (error) {
        logger.error('Failed to get user roles', {
            component: 'user-controller',
            action: 'getUserRoles',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.userId
        });
        res.status(500).json({
            error: 'Failed to get user roles',
            code: 'USER_ROLES_GET_FAILED'
        });
    }
};

/**
 * Reset user password (admin only)
 * POST /api/users/:id/reset-password
 */
export const resetUserPassword = [
    [
        body('newPassword').isLength({ min: 8 }),
        body('forceChange').optional().isBoolean()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { newPassword, forceChange = true } = req.body;

            const where = { id };
            
            // Company isolation for non-global admins
            if (!req.user.roles.includes('global_admin')) {
                where.company_id = req.user.companyId;
            }

            // Check if user exists
            const user = await prisma.users.findFirst({ where });
            if (!user) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Validate password strength
            const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    error: 'Password does not meet requirements',
                    code: 'WEAK_PASSWORD',
                    details: passwordValidation.errors
                });
            }

            // Hash new password
            const passwordHash = await PasswordService.hashPassword(newPassword);

            // Update password
            await prisma.users.update({
                where: { id },
                data: {
                    password_hash: passwordHash,
                    password_changed_at: new Date(),
                    force_password_change: forceChange,
                    updated_by: req.user.id
                }
            });

            // Revoke all user sessions
            await prisma.user_sessions.updateMany({
                where: {
                    user_id: id,
                    is_active: true
                },
                data: {
                    is_active: false
                }
            });

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            logger.error('Failed to reset password', {
            component: 'user-controller',
            action: 'resetPassword',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.id
        });
            res.status(500).json({
                error: 'Failed to reset password',
                code: 'PASSWORD_RESET_FAILED'
            });
        }
    }
];

export default {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    assignRole,
    removeRole,
    getUserRoles,
    resetUserPassword
};