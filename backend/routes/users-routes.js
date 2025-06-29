import express from 'express';
import { PrismaClient } from '@prisma/client';
import middleware from '../auth/middleware.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import personController from '../controllers/personController.js';

const { authenticate: authenticateToken, authorize: requirePermission, requireSameCompany: requireCompanyAccess } = middleware;
const router = express.Router();
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

// GET /users - Get all users for company (admin only) - BACKWARD COMPATIBLE ROUTE
router.get('/', 
    authenticateToken(), 
    requirePermission('users:read'), 
    requireCompanyAccess,
    async (req, res) => {
        logger.info('Using backward compatible get users route', {
            method: 'GET',
            companyId: req.user.company_id
        });
        
        return personController.getSystemUsers(req, res);
    }
);

// GET /users/:id - Get specific user - BACKWARD COMPATIBLE ROUTE
router.get('/:id', 
    authenticateToken(), 
    requirePermission('users:read'),
    async (req, res) => {
        logger.info('Using backward compatible get user by id route', {
            method: 'GET',
            id: req.params.id
        });
        
        return personController.getPersonById(req, res);
    }
);

// PUT /users/:id - Update user - BACKWARD COMPATIBLE ROUTE
router.put('/:id',
    authenticateToken(),
    [
        body('email').optional().isEmail().withMessage('Invalid email format'),
        body('first_name').optional().isLength({ min: 1, max: 50 }).withMessage('First name must be 1-50 characters'),
        body('last_name').optional().isLength({ min: 1, max: 50 }).withMessage('Last name must be 1-50 characters'),
        body('role').optional().isIn(['admin', 'manager', 'user']).withMessage('Invalid role')
    ],
    validateRequest,
    async (req, res) => {
        logger.info('Using backward compatible update user route', {
            method: 'PUT',
            id: req.params.id,
            body: req.body
        });
        
        return personController.updatePerson(req, res);
    }
);

// DELETE /users/:id - Soft delete user (admin only) - BACKWARD COMPATIBLE ROUTE
router.delete('/:id', 
    authenticateToken(), 
    requirePermission('users:delete'),
    async (req, res) => {
        logger.info('Using backward compatible delete user route', {
            method: 'DELETE',
            id: req.params.id
        });
        
        return personController.deletePerson(req, res);
    }
);

// PUT /users/:id/activate - Activate/deactivate user (admin only)
router.put('/:id/activate', 
    authenticateToken(), 
    requirePermission('users:update'),
    [
        body('is_active').isBoolean().withMessage('is_active must be a boolean')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            
            if (isNaN(userId)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }
            
            // Prevent self-deactivation
            if (userId === req.user.id && !req.body.is_active) {
                return res.status(400).json({ 
                    error: 'Bad request',
                    message: 'Cannot deactivate your own account'
                });
            }
            
            const existingUser = await prisma.user.findUnique({
                where: { 
                    id: userId,
                    company_id: req.user.company_id,
                    eliminato: false
                }
            });
            
            if (!existingUser) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    is_active: req.body.is_active,
                    updated_by: req.user.id,
                    updated_at: new Date()
                },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    is_active: true,
                    updated_at: true
                }
            });
            
            res.json(user);
        } catch (error) {
            logger.error('Failed to update user activation status', {
            component: 'users-routes',
            action: 'updateUserActivation',
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
            targetUserId: req.params?.id
        });
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to update user activation status'
            });
        }
    }
);

export default router;