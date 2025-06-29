/**
 * GDPR Compliance Routes
 * Data protection, privacy rights, and compliance endpoints
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { GDPRService } from '../services/gdpr-service.js';
import { authenticateAdvanced } from '../middleware/auth-advanced.js';
import { requirePermissions, requireRoles } from '../middleware/rbac.js';
import logger from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Rate limiting for GDPR endpoints
 */
const gdprRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 requests per hour
    message: {
        error: 'Too many GDPR requests',
        code: 'GDPR_RATE_LIMIT_EXCEEDED',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Record user consent
 */
router.post('/consent',
    authenticateAdvanced,
    [
        body('consentType').isString().isIn([
            'marketing',
            'analytics',
            'functional',
            'authentication',
            'data_processing',
            'third_party_sharing'
        ]),
        body('purpose').isString().isLength({ min: 10, max: 500 }),
        body('legalBasis').optional().isString().isIn([
            'consent',
            'contract',
            'legal_obligation',
            'vital_interests',
            'public_task',
            'legitimate_interest'
        ])
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
            
            const { consentType, purpose, legalBasis = 'consent' } = req.body;
            const userId = req.user.id;
            
            const consent = await GDPRService.recordConsent(
                userId,
                consentType,
                purpose,
                legalBasis
            );
            
            // Update consent record with request details
            await prisma.consentRecord.update({
                where: { id: consent.id },
                data: {
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                }
            });
            
            logger.info('User consent recorded', {
                component: 'gdpr-routes',
                action: 'recordConsent',
                userId,
                consentType,
                purpose,
                consentId: consent.id,
                ip: req.ip
            });
            
            res.status(201).json({
                message: 'Consent recorded successfully',
                consent: {
                    id: consent.id,
                    consentType: consent.consentType,
                    purpose: consent.purpose,
                    consentDate: consent.consentDate,
                    legalBasis: consent.legalBasis
                }
            });
            
        } catch (error) {
            logger.error('Failed to record consent', {
                component: 'gdpr-routes',
                action: 'recordConsent',
                error: error.message,
                userId: req.user?.id,
                body: req.body
            });
            
            res.status(500).json({
                error: 'Failed to record consent',
                code: 'GDPR_CONSENT_RECORD_FAILED'
            });
        }
    }
);

/**
 * Withdraw user consent
 */
router.post('/consent/withdraw',
    authenticateAdvanced,
    [
        body('consentType').isString().notEmpty(),
        body('reason').optional().isString().isLength({ max: 500 })
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
            
            const { consentType, reason } = req.body;
            const userId = req.user.id;
            
            const consent = await GDPRService.withdrawConsent(
                userId,
                consentType,
                reason
            );
            
            logger.info('User consent withdrawn', {
                component: 'gdpr-routes',
                action: 'withdrawConsent',
                userId,
                consentType,
                reason,
                consentId: consent.id,
                ip: req.ip
            });
            
            res.json({
                message: 'Consent withdrawn successfully',
                consent: {
                    id: consent.id,
                    consentType: consent.consentType,
                    withdrawnAt: consent.withdrawnAt,
                    withdrawalReason: consent.withdrawalReason
                }
            });
            
        } catch (error) {
            logger.error('Failed to withdraw consent', {
                component: 'gdpr-routes',
                action: 'withdrawConsent',
                error: error.message,
                userId: req.user?.id,
                body: req.body
            });
            
            res.status(500).json({
                error: 'Failed to withdraw consent',
                code: 'GDPR_CONSENT_WITHDRAW_FAILED'
            });
        }
    }
);

/**
 * Get user's consent status
 */
router.get('/consent',
    authenticateAdvanced,
    async (req, res) => {
        try {
            const userId = req.user.id;
            
            const consents = await prisma.consentRecord.findMany({
                where: { userId },
                orderBy: {
                    consentDate: 'desc'
                },
                select: {
                    id: true,
                    consentType: true,
                    purpose: true,
                    consentGiven: true,
                    consentDate: true,
                    withdrawnAt: true,
                    legalBasis: true,
                    version: true
                }
            });
            
            // Group by consent type to show current status
            const consentStatus = {};
            consents.forEach(consent => {
                if (!consentStatus[consent.consentType] || 
                    consent.consentDate > consentStatus[consent.consentType].consentDate) {
                    consentStatus[consent.consentType] = consent;
                }
            });
            
            res.json({
                consents: Object.values(consentStatus),
                history: consents
            });
            
        } catch (error) {
            logger.error('Failed to get consent status', {
                component: 'gdpr-routes',
                action: 'getConsent',
                error: error.message,
                userId: req.user?.id
            });
            
            res.status(500).json({
                error: 'Failed to get consent status',
                code: 'GDPR_CONSENT_GET_FAILED'
            });
        }
    }
);

/**
 * Export user data (Right to Data Portability)
 */
router.post('/export',
    authenticateAdvanced,
    gdprRateLimit,
    [
        body('format').optional().isString().isIn(['json', 'csv']),
        body('includeHistory').optional().isBoolean()
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
            
            const { format = 'json', includeHistory = true } = req.body;
            const userId = req.user.id;
            
            // Check if user has given consent for data export
            const hasConsent = await GDPRService.hasConsent(userId, 'data_processing');
            if (!hasConsent) {
                return res.status(403).json({
                    error: 'Data export requires consent for data processing',
                    code: 'GDPR_CONSENT_REQUIRED'
                });
            }
            
            const exportedData = await GDPRService.exportUserData(userId, format);
            
            logger.info('User data exported', {
                component: 'gdpr-routes',
                action: 'exportData',
                userId,
                format,
                includeHistory,
                ip: req.ip
            });
            
            // Set appropriate headers for download
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `user_data_${userId}_${timestamp}.${format}`;
            
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
            
            res.send(exportedData);
            
        } catch (error) {
            logger.error('Failed to export user data', {
                component: 'gdpr-routes',
                action: 'exportData',
                error: error.message,
                userId: req.user?.id,
                body: req.body
            });
            
            res.status(500).json({
                error: 'Failed to export user data',
                code: 'GDPR_EXPORT_FAILED'
            });
        }
    }
);

/**
 * Request data deletion (Right to be Forgotten)
 */
router.post('/delete-request',
    authenticateAdvanced,
    gdprRateLimit,
    [
        body('reason').isString().isLength({ min: 10, max: 1000 }),
        body('confirmEmail').isEmail().normalizeEmail(),
        body('anonymize').optional().isBoolean()
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
            
            const { reason, confirmEmail, anonymize = true } = req.body;
            const userId = req.user.id;
            
            // Verify email matches user's email
            if (confirmEmail !== req.user.email) {
                return res.status(400).json({
                    error: 'Confirmation email does not match account email',
                    code: 'GDPR_EMAIL_MISMATCH'
                });
            }
            
            // Create deletion request record
            const deletionRequest = await prisma.gdprAuditLog.create({
                data: {
                    userId,
                    action: 'DELETION_REQUESTED',
                    dataType: 'ALL_USER_DATA',
                    purpose: 'Right to be forgotten',
                    legalBasis: 'user_request',
                    details: JSON.stringify({
                        reason,
                        anonymize,
                        requestDate: new Date(),
                        status: 'pending'
                    }),
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date()
                }
            });
            
            logger.info('Data deletion requested', {
                component: 'gdpr-routes',
                action: 'requestDeletion',
                userId,
                reason,
                anonymize,
                requestId: deletionRequest.id,
                ip: req.ip
            });
            
            res.status(202).json({
                message: 'Data deletion request submitted successfully',
                requestId: deletionRequest.id,
                status: 'pending',
                note: 'Your request will be processed within 30 days as required by GDPR'
            });
            
        } catch (error) {
            logger.error('Failed to request data deletion', {
                component: 'gdpr-routes',
                action: 'requestDeletion',
                error: error.message,
                userId: req.user?.id,
                body: req.body
            });
            
            res.status(500).json({
                error: 'Failed to request data deletion',
                code: 'GDPR_DELETION_REQUEST_FAILED'
            });
        }
    }
);

/**
 * Process data deletion (Admin only)
 */
router.post('/process-deletion/:requestId',
    authenticateAdvanced,
    requireRoles(['global_admin', 'data_protection_officer']),
    [
        body('approved').isBoolean(),
        body('adminNotes').optional().isString().isLength({ max: 1000 })
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
            
            const { requestId } = req.params;
            const { approved, adminNotes } = req.body;
            const adminUserId = req.user.id;
            
            // Get deletion request
            const deletionRequest = await prisma.gdprAuditLog.findUnique({
                where: { id: requestId }
            });
            
            if (!deletionRequest || deletionRequest.action !== 'DELETION_REQUESTED') {
                return res.status(404).json({
                    error: 'Deletion request not found',
                    code: 'GDPR_REQUEST_NOT_FOUND'
                });
            }
            
            const requestDetails = JSON.parse(deletionRequest.details);
            
            if (approved) {
                // Process the deletion
                const deletionSummary = await GDPRService.deleteUserData(
                    deletionRequest.userId,
                    {
                        anonymize: requestDetails.anonymize,
                        reason: requestDetails.reason
                    }
                );
                
                // Update request status
                await prisma.gdprAuditLog.update({
                    where: { id: requestId },
                    data: {
                        details: JSON.stringify({
                            ...requestDetails,
                            status: 'completed',
                            processedDate: new Date(),
                            processedBy: adminUserId,
                            adminNotes,
                            deletionSummary
                        })
                    }
                });
                
                logger.info('Data deletion processed', {
                    component: 'gdpr-routes',
                    action: 'processDeletion',
                    requestId,
                    userId: deletionRequest.userId,
                    adminUserId,
                    approved: true,
                    deletionSummary
                });
                
                res.json({
                    message: 'Data deletion completed successfully',
                    requestId,
                    status: 'completed',
                    deletionSummary
                });
            } else {
                // Reject the deletion request
                await prisma.gdprAuditLog.update({
                    where: { id: requestId },
                    data: {
                        details: JSON.stringify({
                            ...requestDetails,
                            status: 'rejected',
                            processedDate: new Date(),
                            processedBy: adminUserId,
                            adminNotes
                        })
                    }
                });
                
                logger.info('Data deletion rejected', {
                    component: 'gdpr-routes',
                    action: 'processDeletion',
                    requestId,
                    userId: deletionRequest.userId,
                    adminUserId,
                    approved: false,
                    adminNotes
                });
                
                res.json({
                    message: 'Data deletion request rejected',
                    requestId,
                    status: 'rejected',
                    reason: adminNotes
                });
            }
            
        } catch (error) {
            logger.error('Failed to process data deletion', {
                component: 'gdpr-routes',
                action: 'processDeletion',
                error: error.message,
                requestId: req.params?.requestId,
                adminUserId: req.user?.id
            });
            
            res.status(500).json({
                error: 'Failed to process data deletion',
                code: 'GDPR_DELETION_PROCESS_FAILED'
            });
        }
    }
);

/**
 * Get user's GDPR audit trail
 */
router.get('/audit-trail',
    authenticateAdvanced,
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
        query('action').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601()
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
            
            const userId = req.user.id;
            const {
                limit = 50,
                offset = 0,
                action,
                startDate,
                endDate
            } = req.query;
            
            const auditTrail = await GDPRService.getAuditTrail(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset),
                action,
                startDate,
                endDate
            });
            
            res.json(auditTrail);
            
        } catch (error) {
            logger.error('Failed to get audit trail', {
                component: 'gdpr-routes',
                action: 'getAuditTrail',
                error: error.message,
                userId: req.user?.id,
                query: req.query
            });
            
            res.status(500).json({
                error: 'Failed to get audit trail',
                code: 'GDPR_AUDIT_TRAIL_FAILED'
            });
        }
    }
);

/**
 * Generate compliance report (Admin only)
 */
router.get('/compliance-report',
    authenticateAdvanced,
    requireRoles(['global_admin', 'data_protection_officer']),
    [
        query('companyId').optional().isString()
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
            
            const { companyId } = req.query;
            
            // Check if user can access company data
            if (companyId && req.user.companyId !== companyId && !req.user.roles.includes('global_admin')) {
                return res.status(403).json({
                    error: 'Access denied to company data',
                    code: 'GDPR_COMPANY_ACCESS_DENIED'
                });
            }
            
            const report = await GDPRService.generateComplianceReport(companyId);
            
            logger.info('GDPR compliance report generated', {
                component: 'gdpr-routes',
                action: 'generateComplianceReport',
                adminUserId: req.user.id,
                companyId,
                reportSummary: report.summary
            });
            
            res.json(report);
            
        } catch (error) {
            logger.error('Failed to generate compliance report', {
                component: 'gdpr-routes',
                action: 'generateComplianceReport',
                error: error.message,
                adminUserId: req.user?.id,
                query: req.query
            });
            
            res.status(500).json({
                error: 'Failed to generate compliance report',
                code: 'GDPR_COMPLIANCE_REPORT_FAILED'
            });
        }
    }
);

/**
 * Get pending deletion requests (Admin only)
 */
router.get('/deletion-requests',
    authenticateAdvanced,
    requireRoles(['global_admin', 'data_protection_officer']),
    [
        query('status').optional().isString().isIn(['pending', 'completed', 'rejected']),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
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
            
            const {
                status = 'pending',
                limit = 50,
                offset = 0
            } = req.query;
            
            const requests = await prisma.gdprAuditLog.findMany({
                where: {
                    action: 'DELETION_REQUESTED',
                    details: {
                        contains: `"status":"${status}"`
                    }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            companyId: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: parseInt(limit),
                skip: parseInt(offset)
            });
            
            const total = await prisma.gdprAuditLog.count({
                where: {
                    action: 'DELETION_REQUESTED',
                    details: {
                        contains: `"status":"${status}"`
                    }
                }
            });
            
            const formattedRequests = requests.map(request => ({
                id: request.id,
                userId: request.userId,
                user: request.user,
                requestDate: request.timestamp,
                details: JSON.parse(request.details),
                ipAddress: request.ipAddress
            }));
            
            res.json({
                requests: formattedRequests,
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            
        } catch (error) {
            logger.error('Failed to get deletion requests', {
                component: 'gdpr-routes',
                action: 'getDeletionRequests',
                error: error.message,
                adminUserId: req.user?.id,
                query: req.query
            });
            
            res.status(500).json({
                error: 'Failed to get deletion requests',
                code: 'GDPR_DELETION_REQUESTS_FAILED'
            });
        }
    }
);

export default router;