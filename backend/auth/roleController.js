/**
 * Role and Permission Management Controller
 * Handles CRUD operations for roles and permissions
 */

import { PrismaClient } from '@prisma/client';
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
 * Get all roles
 * GET /api/roles
 */
export const getRoles = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            search,
            companyId,
            isSystemRole,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Build where clause
        const where = {};
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.OR = [
                { is_system_role: true },
                { company_id: req.user.companyId }
            ];
        } else if (companyId) {
            where.company_id = companyId;
        }
        
        // Search filter
        if (search) {
            where.OR = [
                ...(where.OR || []),
                { name: { contains: search, mode: 'insensitive' } },
                { display_name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        // System role filter
        if (isSystemRole !== undefined) {
            where.is_system_role = isSystemRole === 'true';
        }

        // Get roles with pagination
        const [roles, total] = await Promise.all([
            prisma.roles.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            user_roles: {
                                where: { is_active: true }
                            }
                        }
                    },
                    company: {
                        select: {
                            id: true,
                            nome: true
                        }
                    }
                },
                orderBy: {
                    [sortBy]: sortOrder
                },
                skip: offset,
                take: parseInt(limit)
            }),
            prisma.roles.count({ where })
        ]);

        // Format response
        const formattedRoles = roles.map(role => ({
            id: role.id,
            name: role.name,
            displayName: role.display_name,
            description: role.description,
            permissions: role.permissions,
            isSystemRole: role.is_system_role,
            companyId: role.company_id,
            company: role.company,
            userCount: role._count.user_roles,
            createdAt: role.created_at,
            updatedAt: role.updated_at
        }));

        res.json({
            success: true,
            data: formattedRoles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        logger.error('Failed to fetch roles', {
            component: 'role-controller',
            action: 'getRoles',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            companyId: req.query?.companyId
        });
        res.status(500).json({
            error: 'Failed to get roles',
            code: 'ROLE_GET_FAILED'
        });
    }
};

/**
 * Get role by ID
 * GET /api/roles/:id
 */
export const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const where = { id };
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.OR = [
                { is_system_role: true },
                { company_id: req.user.companyId }
            ];
        }

        const role = await prisma.roles.findFirst({
            where,
            include: {
                user_roles: {
                    where: { is_active: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                },
                company: true
            }
        });

        if (!role) {
            return res.status(404).json({
                error: 'Role not found',
                code: 'ROLE_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                id: role.id,
                name: role.name,
                displayName: role.display_name,
                description: role.description,
                permissions: role.permissions,
                isSystemRole: role.is_system_role,
                companyId: role.company_id,
                company: role.company,
                users: role.user_roles.map(ur => ur.user),
                createdAt: role.created_at,
                updatedAt: role.updated_at
            }
        });

    } catch (error) {
        logger.error('Failed to fetch role', {
            component: 'role-controller',
            action: 'getRole',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            roleId: req.params?.id
        });
        res.status(500).json({
            error: 'Failed to get role',
            code: 'ROLE_GET_FAILED'
        });
    }
};

/**
 * Create new role
 * POST /api/roles
 */
export const createRole = [
    [
        body('name').isLength({ min: 1 }).trim().matches(/^[a-z_]+$/),
        body('displayName').isLength({ min: 1 }).trim(),
        body('description').optional().isLength({ max: 500 }).trim(),
        body('permissions').isArray(),
        body('companyId').isUUID().optional()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const {
                name,
                displayName,
                description,
                permissions = [],
                companyId
            } = req.body;

            // Use requester's company if not specified (unless global admin)
            const targetCompanyId = companyId || 
                (req.user.roles.includes('global_admin') ? null : req.user.companyId);

            // Check if role name already exists in the same scope
            const existingRole = await prisma.roles.findFirst({
                where: {
                    name,
                    OR: [
                        { is_system_role: true },
                        { company_id: targetCompanyId }
                    ]
                }
            });

            if (existingRole) {
                return res.status(409).json({
                    error: 'Role name already exists',
                    code: 'ROLE_NAME_EXISTS'
                });
            }

            // Validate permissions format
            const validPermissions = permissions.every(p => 
                typeof p === 'string' && p.includes('.')
            );

            if (!validPermissions) {
                return res.status(400).json({
                    error: 'Invalid permission format. Use resource.action format',
                    code: 'INVALID_PERMISSION_FORMAT'
                });
            }

            // Create role
            const role = await prisma.roles.create({
                data: {
                    name,
                    display_name: displayName,
                    description,
                    permissions,
                    company_id: targetCompanyId,
                    is_system_role: false,
                    created_by: req.user.id
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            nome: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                data: {
                    id: role.id,
                    name: role.name,
                    displayName: role.display_name,
                    description: role.description,
                    permissions: role.permissions,
                    isSystemRole: role.is_system_role,
                    companyId: role.company_id,
                    company: role.company,
                    createdAt: role.created_at
                }
            });

        } catch (error) {
            logger.error('Failed to create role', {
            component: 'role-controller',
            action: 'createRole',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            roleName: req.body?.name
        });
            res.status(500).json({
                error: 'Failed to create role',
                code: 'ROLE_CREATE_FAILED'
            });
        }
    }
];

/**
 * Update role
 * PUT /api/roles/:id
 */
export const updateRole = [
    [
        body('displayName').optional().isLength({ min: 1 }).trim(),
        body('description').optional().isLength({ max: 500 }).trim(),
        body('permissions').optional().isArray()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                displayName,
                description,
                permissions
            } = req.body;

            const where = { id };
            
            // Company isolation for non-global admins
            if (!req.user.roles.includes('global_admin')) {
                where.OR = [
                    { company_id: req.user.companyId },
                    { is_system_role: false } // Can't edit system roles
                ];
            }

            // Check if role exists and is editable
            const existingRole = await prisma.roles.findFirst({ where });
            if (!existingRole) {
                return res.status(404).json({
                    error: 'Role not found or not editable',
                    code: 'ROLE_NOT_FOUND'
                });
            }

            // System roles can only be edited by global admins
            if (existingRole.is_system_role && !req.user.roles.includes('global_admin')) {
                return res.status(403).json({
                    error: 'Cannot edit system roles',
                    code: 'SYSTEM_ROLE_EDIT_FORBIDDEN'
                });
            }

            // Validate permissions format if provided
            if (permissions) {
                const validPermissions = permissions.every(p => 
                    typeof p === 'string' && p.includes('.')
                );

                if (!validPermissions) {
                    return res.status(400).json({
                        error: 'Invalid permission format. Use resource.action format',
                        code: 'INVALID_PERMISSION_FORMAT'
                    });
                }
            }

            // Build update data
            const updateData = { updated_by: req.user.id };
            if (displayName !== undefined) updateData.display_name = displayName;
            if (description !== undefined) updateData.description = description;
            if (permissions !== undefined) updateData.permissions = permissions;

            // Update role
            const role = await prisma.roles.update({
                where: { id },
                data: updateData,
                include: {
                    company: {
                        select: {
                            id: true,
                            nome: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                data: {
                    id: role.id,
                    name: role.name,
                    displayName: role.display_name,
                    description: role.description,
                    permissions: role.permissions,
                    isSystemRole: role.is_system_role,
                    companyId: role.company_id,
                    company: role.company,
                    updatedAt: role.updated_at
                }
            });

        } catch (error) {
            logger.error('Failed to update role', {
            component: 'role-controller',
            action: 'updateRole',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            roleId: req.params?.id
        });
            res.status(500).json({
                error: 'Failed to update role',
                code: 'ROLE_UPDATE_FAILED'
            });
        }
    }
];

/**
 * Delete role
 * DELETE /api/roles/:id
 */
export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        
        const where = { id };
        
        // Company isolation for non-global admins
        if (!req.user.roles.includes('global_admin')) {
            where.OR = [
                { company_id: req.user.companyId },
                { is_system_role: false } // Can't delete system roles
            ];
        }

        // Check if role exists and is deletable
        const existingRole = await prisma.roles.findFirst({ where });
        if (!existingRole) {
            return res.status(404).json({
                error: 'Role not found or not deletable',
                code: 'ROLE_NOT_FOUND'
            });
        }

        // System roles cannot be deleted
        if (existingRole.is_system_role) {
            return res.status(403).json({
                error: 'Cannot delete system roles',
                code: 'SYSTEM_ROLE_DELETE_FORBIDDEN'
            });
        }

        // Check if role is assigned to users
        const activeAssignments = await prisma.user_roles.count({
            where: {
                role_id: id,
                is_active: true
            }
        });

        if (activeAssignments > 0) {
            return res.status(400).json({
                error: 'Cannot delete role with active user assignments',
                code: 'ROLE_HAS_ACTIVE_USERS',
                activeAssignments
            });
        }

        // Delete role
        await prisma.roles.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Role deleted successfully'
        });

    } catch (error) {
        logger.error('Failed to delete role', {
            component: 'role-controller',
            action: 'deleteRole',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            roleId: req.params?.id
        });
        res.status(500).json({
            error: 'Failed to delete role',
            code: 'ROLE_DELETE_FAILED'
        });
    }
};

/**
 * Get available permissions
 * GET /api/permissions
 */
export const getPermissions = async (req, res) => {
    try {
        // Define available permissions by resource
        const permissions = {
            users: [
                'users.view',
                'users.create',
                'users.update',
                'users.delete',
                'users.manage_roles'
            ],
            roles: [
                'roles.view',
                'roles.create',
                'roles.update',
                'roles.delete'
            ],
            companies: [
                'companies.view',
                'companies.create',
                'companies.update',
                'companies.delete',
                'companies.manage_settings'
            ],
            employees: [
                'employees.view',
                'employees.create',
                'employees.update',
                'employees.delete'
            ],
            courses: [
                'courses.view',
                'courses.create',
                'courses.update',
                'courses.delete',
                'courses.manage_schedules'
            ],
            enrollments: [
                'enrollments.view',
                'enrollments.create',
                'enrollments.update',
                'enrollments.delete'
            ],
            trainers: [
                'trainers.view',
                'trainers.create',
                'trainers.update',
                'trainers.delete'
            ],
            sessions: [
                'sessions.view',
                'sessions.create',
                'sessions.update',
                'sessions.delete',
                'sessions.manage_attendance'
            ],
            documents: [
                'documents.view',
                'documents.create',
                'documents.update',
                'documents.delete',
                'documents.download'
            ],
            reports: [
                'reports.view',
                'reports.create',
                'reports.export'
            ],
            system: [
                'system.admin',
                'system.audit_logs',
                'system.settings'
            ]
        };

        // Flatten permissions with descriptions
        const allPermissions = [];
        
        Object.entries(permissions).forEach(([resource, perms]) => {
            perms.forEach(permission => {
                const [res, action] = permission.split('.');
                allPermissions.push({
                    name: permission,
                    resource: res,
                    action: action,
                    description: getPermissionDescription(permission)
                });
            });
        });

        res.json({
            success: true,
            data: {
                byResource: permissions,
                all: allPermissions
            }
        });

    } catch (error) {
        logger.error('Failed to fetch permissions', {
            component: 'role-controller',
            action: 'getPermissions',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({
            error: 'Failed to get permissions',
            code: 'PERMISSIONS_GET_FAILED'
        });
    }
};

/**
 * Get permission description
 */
function getPermissionDescription(permission) {
    const descriptions = {
        // Users
        'users.view': 'Visualizzare utenti',
        'users.create': 'Creare nuovi utenti',
        'users.update': 'Modificare utenti esistenti',
        'users.delete': 'Eliminare utenti',
        'users.manage_roles': 'Gestire ruoli utenti',
        
        // Roles
        'roles.view': 'Visualizzare ruoli',
        'roles.create': 'Creare nuovi ruoli',
        'roles.update': 'Modificare ruoli esistenti',
        'roles.delete': 'Eliminare ruoli',
        
        // Companies
        'companies.view': 'Visualizzare aziende',
        'companies.create': 'Creare nuove aziende',
        'companies.update': 'Modificare aziende esistenti',
        'companies.delete': 'Eliminare aziende',
        'companies.manage_settings': 'Gestire impostazioni azienda',
        
        // Employees
        'employees.view': 'Visualizzare dipendenti',
        'employees.create': 'Creare nuovi dipendenti',
        'employees.update': 'Modificare dipendenti esistenti',
        'employees.delete': 'Eliminare dipendenti',
        
        // Courses
        'courses.view': 'Visualizzare corsi',
        'courses.create': 'Creare nuovi corsi',
        'courses.update': 'Modificare corsi esistenti',
        'courses.delete': 'Eliminare corsi',
        'courses.manage_schedules': 'Gestire programmazioni corsi',
        
        // Enrollments
        'enrollments.view': 'Visualizzare iscrizioni',
        'enrollments.create': 'Creare nuove iscrizioni',
        'enrollments.update': 'Modificare iscrizioni esistenti',
        'enrollments.delete': 'Eliminare iscrizioni',
        
        // Trainers
        'trainers.view': 'Visualizzare formatori',
        'trainers.create': 'Creare nuovi formatori',
        'trainers.update': 'Modificare formatori esistenti',
        'trainers.delete': 'Eliminare formatori',
        
        // Sessions
        'sessions.view': 'Visualizzare sessioni',
        'sessions.create': 'Creare nuove sessioni',
        'sessions.update': 'Modificare sessioni esistenti',
        'sessions.delete': 'Eliminare sessioni',
        'sessions.manage_attendance': 'Gestire presenze',
        
        // Documents
        'documents.view': 'Visualizzare documenti',
        'documents.create': 'Creare nuovi documenti',
        'documents.update': 'Modificare documenti esistenti',
        'documents.delete': 'Eliminare documenti',
        'documents.download': 'Scaricare documenti',
        
        // Reports
        'reports.view': 'Visualizzare report',
        'reports.create': 'Creare nuovi report',
        'reports.export': 'Esportare report',
        
        // System
        'system.admin': 'Amministrazione sistema',
        'system.audit_logs': 'Visualizzare log di audit',
        'system.settings': 'Gestire impostazioni sistema'
    };
    
    return descriptions[permission] || permission;
}

/**
 * Clone role
 * POST /api/roles/:id/clone
 */
export const cloneRole = [
    [
        body('name').isLength({ min: 1 }).trim().matches(/^[a-z_]+$/),
        body('displayName').isLength({ min: 1 }).trim(),
        body('companyId').isUUID().optional()
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { name, displayName, companyId } = req.body;

            // Get source role
            const sourceRole = await prisma.roles.findFirst({
                where: {
                    id,
                    OR: [
                        { is_system_role: true },
                        { company_id: req.user.companyId }
                    ]
                }
            });

            if (!sourceRole) {
                return res.status(404).json({
                    error: 'Source role not found',
                    code: 'ROLE_NOT_FOUND'
                });
            }

            // Use requester's company if not specified
            const targetCompanyId = companyId || req.user.companyId;

            // Check if new role name already exists
            const existingRole = await prisma.roles.findFirst({
                where: {
                    name,
                    OR: [
                        { is_system_role: true },
                        { company_id: targetCompanyId }
                    ]
                }
            });

            if (existingRole) {
                return res.status(409).json({
                    error: 'Role name already exists',
                    code: 'ROLE_NAME_EXISTS'
                });
            }

            // Clone role
            const clonedRole = await prisma.roles.create({
                data: {
                    name,
                    display_name: displayName,
                    description: `Cloned from ${sourceRole.display_name}`,
                    permissions: sourceRole.permissions,
                    company_id: targetCompanyId,
                    is_system_role: false,
                    created_by: req.user.id
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            nome: true
                        }
                    }
                }
            });

            res.status(201).json({
                success: true,
                data: {
                    id: clonedRole.id,
                    name: clonedRole.name,
                    displayName: clonedRole.display_name,
                    description: clonedRole.description,
                    permissions: clonedRole.permissions,
                    isSystemRole: clonedRole.is_system_role,
                    companyId: clonedRole.company_id,
                    company: clonedRole.company,
                    createdAt: clonedRole.created_at
                }
            });

        } catch (error) {
            logger.error('Failed to clone role', {
            component: 'role-controller',
            action: 'cloneRole',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            sourceRoleId: req.params?.id
        });
            res.status(500).json({
                error: 'Failed to clone role',
                code: 'ROLE_CLONE_FAILED'
            });
        }
    }
];

export default {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getPermissions,
    cloneRole
};