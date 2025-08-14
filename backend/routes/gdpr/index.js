/**
 * GDPR Router Principale - Sistema Modulare
 * Orchestratore per tutti i moduli GDPR
 * 
 * Moduli inclusi:
 * - /consents - Gestione consensi (consent-management.js)
 * - /data-export - Esportazione dati (data-export.js)  
 * - /data-deletion - Cancellazione dati (data-deletion.js)
 * - /audit - Audit e compliance (audit-compliance.js)
 * 
 * Caratteristiche:
 * - Architettura modulare per manutenibilità
 * - Middleware globali condivisi
 * - Logging centralizzato
 * - Health check integrato
 * - Gestione errori unificata
 */

import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import { authenticateAdvanced } from '../../middleware/auth-advanced.js';
import { logGdprRequest } from '../../middleware/gdprMiddleware.js';
import { logger } from '../../utils/logger.js';
import prismaOptimized from '../../config/prisma-optimization.js';

// Import moduli specializzati
import consentManagementRouter from './consent-management.js';
import dataExportRouter from './data-export.js';
import dataDeletionRouter from './data-deletion.js';
import auditComplianceRouter from './audit-compliance.js';

const router = express.Router();
const prisma = prismaOptimized;

// Middleware globali per tutte le route GDPR
router.use(logGdprRequest);

// Health check per il sistema GDPR
router.get('/health', (req, res) => {
    const modules = {
        consentManagement: 'active',
        dataExport: 'active',
        dataDeletion: 'active',
        auditCompliance: 'active'
    };
    
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        modules,
        version: '2.0.0',
        description: 'GDPR Compliance System - Modular Architecture'
    });
});

// Informazioni sui moduli caricati
router.get('/modules', authenticateAdvanced, (req, res) => {
    const modules = [
        {
            name: 'consent-management',
            description: 'Gestione consensi GDPR',
            endpoints: [
                'POST /consents/grant - Concede consenso',
                'POST /consents/revoke - Revoca consenso',
                'POST /consents - Crea consenso',
                'POST /consents/withdraw - Ritira consenso',
                'GET /consents/current-user - Stato consensi utente',
                'GET /consents/:personId - Stato consensi persona (Admin)',
                'GET /consents - Endpoint legacy'
            ],
            status: 'active'
        },
        {
            name: 'data-export',
            description: 'Esportazione dati utente (Diritto alla portabilità)',
            endpoints: [
                'POST /data-export - Esporta dati utente'
            ],
            status: 'active'
        },
        {
            name: 'data-deletion',
            description: 'Cancellazione dati (Diritto all\'oblio)',
            endpoints: [
                'POST /data-deletion/request - Richiesta cancellazione',
                'POST /data-deletion/process/:requestId - Processa cancellazione (Admin)',
                'GET /data-deletion/requests - Lista richieste (Admin)'
            ],
            status: 'active'
        },
        {
            name: 'audit-compliance',
            description: 'Audit trail e compliance',
            endpoints: [
                'GET /audit - Cronologia audit',
                'GET /audit/export - Esportazione audit',
                'POST /audit - Crea entry audit',
                'POST /audit/batch - Crea batch entry',
                'GET /audit/trail - Audit trail (legacy)',
                'GET /audit/compliance-report - Report conformità (Admin)'
            ],
            status: 'active'
        }
    ];
    
    res.json({
        totalModules: modules.length,
        modules,
        loadedAt: new Date().toISOString()
    });
});

// Endpoint legacy per compatibilità con frontend esistente
// GET /consent - Compatibilità con useGDPRConsent hook in src/hooks/
router.get('/consent', authenticate, async (req, res) => {
    try {
        const personId = req.person.id;
        
        const consents = await prisma.consentRecord.findMany({
            where: {
                personId,
                withdrawnAt: null,
                consentGiven: true
            },
            orderBy: { givenAt: 'desc' }
        });
        
        logger.info('Legacy consent endpoint accessed', {
            component: 'gdpr-main-router',
            action: 'getLegacyConsents',
            personId,
            consentCount: consents.length,
            ip: req.ip
        });
        
        res.json({
            success: true,
            data: {
                consents: consents.map(consent => ({
                    id: consent.id,
                    consentType: consent.consentType,
                    purpose: consent.consentType,
                    granted: consent.consentGiven,
                    isActive: consent.withdrawnAt === null,
                    consentDate: consent.givenAt,
                    legalBasis: 'consent'
                }))
            }
        });
        
    } catch (error) {
        logger.error('Failed to get legacy consents', {
            component: 'gdpr-main-router',
            action: 'getLegacyConsents',
            error: error.message,
            personId: req.person?.id
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to get consent status',
            code: 'GDPR_CONSENT_GET_FAILED'
        });
    }
});

// POST /consent - Compatibilità con useGDPRConsent hook in src/hooks/
router.post('/consent', authenticate, async (req, res) => {
    try {
        const { consentType, purpose, legalBasis = 'consent' } = req.body;
        const personId = req.person.id;
        
        // Validazione base
        if (!consentType || !purpose) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: consentType, purpose'
            });
        }
        
        // Revoca consenso precedente se esiste
        await prisma.consentRecord.updateMany({
            where: {
                personId,
                consentType,
                revokedAt: null
            },
            data: {
                revokedAt: new Date(),
                withdrawalReason: 'Replaced by new consent'
            }
        });
        
        // Crea nuovo consenso
        const consent = await prisma.consentRecord.create({
            data: {
                personId,
                consentType,
                purpose,
                legalBasis,
                consentDate: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            }
        });
        
        logger.info('Legacy consent granted', {
            component: 'gdpr-main-router',
            action: 'grantLegacyConsent',
            personId,
            consentType,
            purpose,
            consentId: consent.id,
            ip: req.ip
        });
        
        res.status(201).json({
            success: true,
            data: {
                consent: {
                    id: consent.id,
                    consentType: consent.consentType,
                    purpose: consent.purpose,
                    consentDate: consent.consentDate,
                    legalBasis: consent.legalBasis
                }
            }
        });
        
    } catch (error) {
        logger.error('Failed to grant legacy consent', {
            component: 'gdpr-main-router',
            action: 'grantLegacyConsent',
            error: error.message,
            personId: req.person?.id,
            body: req.body
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to record consent',
            code: 'GDPR_CONSENT_RECORD_FAILED'
        });
    }
});

// Registra i moduli specializzati
router.use('/consents', consentManagementRouter);
router.use('/data-export', dataExportRouter);
router.use('/data-deletion', dataDeletionRouter);
router.use('/audit', auditComplianceRouter);

// Gestione errori globale per GDPR
router.use((error, req, res, next) => {
    logger.error('GDPR Router Error', {
        component: 'gdpr-main-router',
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        personId: req.person?.id
    });
    
    res.status(500).json({
        error: 'Internal GDPR system error',
        code: 'GDPR_SYSTEM_ERROR',
        timestamp: new Date().toISOString()
    });
});

// Log del caricamento del router
logger.info('GDPR Modular Router loaded successfully', {
    component: 'gdpr-main-router',
    modules: ['consent-management', 'data-export', 'data-deletion', 'audit-compliance'],
    timestamp: new Date().toISOString()
});

export default router;