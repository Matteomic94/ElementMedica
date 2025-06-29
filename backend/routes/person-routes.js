import express from 'express';
import { body } from 'express-validator';
import personController from '../controllers/personController.js';
import middleware from '../auth/middleware.js';
import logger from '../utils/logger.js';

const router = express.Router();
const { authenticate: authenticateToken, authorize: requirePermission, auditLog } = middleware;

// Validation middleware per la creazione/aggiornamento di persone
const validatePerson = [
  body('firstName').optional().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
  body('first_name').optional().isLength({ min: 1, max: 100 }).withMessage('First name must be between 1 and 100 characters'),
  body('lastName').optional().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
  body('last_name').optional().isLength({ min: 1, max: 100 }).withMessage('Last name must be between 1 and 100 characters'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isLength({ max: 20 }).withMessage('Phone number too long'),
  body('taxCode').optional().isLength({ max: 16 }).withMessage('Tax code too long'),
  body('codice_fiscale').optional().isLength({ max: 16 }).withMessage('Tax code too long'),
  body('roleType').optional().isIn(['EMPLOYEE', 'TRAINER', 'ADMIN', 'COMPANY_ADMIN', 'MANAGER']).withMessage('Invalid role type')
];

// ===== NUOVE ROUTE UNIFICATE =====

// GET /api/persons/employees - Ottieni tutti i dipendenti
router.get('/employees', 
  authenticateToken(), 
  requirePermission('read:employees'),
  auditLog('VIEW_EMPLOYEES'),
  personController.getEmployees
);

// GET /api/persons/trainers - Ottieni tutti i formatori
router.get('/trainers', 
  authenticateToken(), 
  requirePermission('read:trainers'),
  auditLog('VIEW_TRAINERS'),
  personController.getTrainers
);

// GET /api/persons/users - Ottieni tutti gli utenti sistema
router.get('/users', 
  authenticateToken(), 
  requirePermission('read:users'),
  auditLog('VIEW_USERS'),
  personController.getSystemUsers
);

// GET /api/persons/:id - Ottieni persona per ID
router.get('/:id', 
  authenticateToken(),
  auditLog('VIEW_PERSON'),
  personController.getPersonById
);

// POST /api/persons - Crea nuova persona
router.post('/', 
  authenticateToken(),
  requirePermission('create:persons'),
  validatePerson,
  auditLog('CREATE_PERSON'),
  personController.createPerson
);

// PUT /api/persons/:id - Aggiorna persona
router.put('/:id', 
  authenticateToken(),
  requirePermission('update:persons'),
  validatePerson,
  auditLog('UPDATE_PERSON'),
  personController.updatePerson
);

// DELETE /api/persons/:id - Elimina persona (soft delete)
router.delete('/:id', 
  authenticateToken(),
  requirePermission('delete:persons'),
  auditLog('DELETE_PERSON'),
  personController.deletePerson
);

// POST /api/persons/:id/roles - Aggiungi ruolo a persona
router.post('/:id/roles', 
  authenticateToken(),
  requirePermission('manage:roles'),
  body('roleType').isIn(['EMPLOYEE', 'TRAINER', 'ADMIN', 'COMPANY_ADMIN', 'MANAGER']).withMessage('Invalid role type'),
  auditLog('ADD_PERSON_ROLE'),
  personController.addRole
);

// DELETE /api/persons/:id/roles/:roleType - Rimuovi ruolo da persona
router.delete('/:id/roles/:roleType', 
  authenticateToken(),
  requirePermission('manage:roles'),
  auditLog('REMOVE_PERSON_ROLE'),
  personController.removeRole
);

// ===== ROUTE BACKWARD COMPATIBLE =====
// Queste route mantengono la compatibilità con il frontend esistente

// Middleware per logging delle route backward compatible
const logBackwardCompatibility = (entityType) => (req, res, next) => {
  logger.info(`Using backward compatible route for ${entityType}`, {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });
  next();
};

export default router;