import express from 'express';
const router = express.Router();
import enhancedRoleService from '../services/enhancedRoleService.js';
import { tenantMiddleware, validateUserTenant } from '../middleware/tenant.js';
import middleware from '../auth/middleware.js';
const { authenticate: authenticateToken } = middleware;

/**
 * Routes per la gestione dei ruoli avanzati
 * Week 12: Sistema Utenti Avanzato
 */

// Middleware di autenticazione e tenant per tutte le routes
router.use(authenticateToken());
router.use(tenantMiddleware);
router.use(validateUserTenant);

/**
 * @route GET /api/roles
 * @desc Lista tutti i ruoli disponibili per il tenant
 * @access Authenticated
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { type, scope, active_only = 'true' } = req.query;

    const filters = {
      tenantId,
      active: active_only === 'true'
    };

    if (type) filters.type = type;
    if (scope) filters.scope = scope;

    // Ottieni tutti i tipi di ruolo disponibili
    const availableRoles = Object.entries(enhancedRoleService.ROLE_TYPES).map(([key, value]) => ({
      type: key,
      ...value
    }));

    // Filtra per tipo se specificato
    let filteredRoles = availableRoles;
    if (type) {
      filteredRoles = availableRoles.filter(role => role.type === type);
    }

    // Filtra per scope se specificato
    if (scope) {
      filteredRoles = filteredRoles.filter(role => role.scope === scope);
    }

    res.json({
      success: true,
      data: {
        roles: filteredRoles,
        scopes: Object.entries(enhancedRoleService.ROLE_SCOPES).map(([key, value]) => ({
          scope: key,
          ...value
        }))
      }
    });
  } catch (error) {
    console.error('[ROLES_API] Error listing roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list roles'
    });
  }
});

/**
 * @route GET /api/roles/permissions
 * @desc Lista tutte le permissioni disponibili
 * @access Authenticated
 */
router.get('/permissions', async (req, res) => {
  try {
    const { category } = req.query;

    let permissions = enhancedRoleService.PERMISSIONS;

    // Filtra per categoria se specificata
    if (category) {
      permissions = Object.fromEntries(
        Object.entries(permissions).filter(([key]) => key.startsWith(category))
      );
    }

    // Raggruppa per categoria
    const groupedPermissions = {};
    Object.entries(permissions).forEach(([key, value]) => {
      const category = key.split('.')[0];
      if (!groupedPermissions[category]) {
        groupedPermissions[category] = {};
      }
      groupedPermissions[category][key] = value;
    });

    res.json({
      success: true,
      data: {
        permissions: groupedPermissions,
        categories: Object.keys(groupedPermissions)
      }
    });
  } catch (error) {
    console.error('[ROLES_API] Error listing permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list permissions'
    });
  }
});

/**
 * @route GET /api/roles/users
 * @desc Lista utenti per ruolo
 * @access Admin
 */
router.get('/users', 
  enhancedRoleService.requirePermission('users.read'),
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const { role_type, company_id, department_id, page = 1, limit = 20 } = req.query;

      if (!role_type) {
        return res.status(400).json({
          success: false,
          error: 'Role type is required'
        });
      }

      const filters = { tenantId };
      if (company_id) filters.companyId = company_id;
      if (department_id) filters.departmentId = department_id;

      const result = await enhancedRoleService.getUsersByRole(
        role_type,
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('[ROLES_API] Error getting users by role:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get users by role'
      });
    }
  }
);

/**
 * @route GET /api/roles/stats
 * @desc Statistiche sui ruoli del tenant
 * @access Admin
 */
router.get('/stats',
  enhancedRoleService.requirePermission('analytics.read'),
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const stats = await enhancedRoleService.getRoleStatistics(tenantId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[ROLES_API] Error getting role statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get role statistics'
      });
    }
  }
);

/**
 * @route POST /api/roles/assign
 * @desc Assegna un ruolo a un utente
 * @access Admin with user management permissions
 */
router.post('/assign',
  enhancedRoleService.requirePermission('users.manage_roles'),
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const { userId, roleType, companyId, departmentId, expiresAt, customPermissions } = req.body;

      // Validazione input
      if (!userId || !roleType) {
        return res.status(400).json({
          success: false,
          error: 'User ID and role type are required'
        });
      }

      // Verifica che il tipo di ruolo esista
      if (!enhancedRoleService.ROLE_TYPES[roleType]) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role type'
        });
      }

      // Verifica che l'utente appartenga al tenant
      // Questo dovrebbe essere fatto tramite una query al database
      // Per ora assumiamo che sia valido se passa il middleware

      const role = await enhancedRoleService.assignRole(userId, tenantId, roleType, {
        companyId,
        departmentId,
        assignedBy: req.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        customPermissions
      });

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role assigned successfully'
      });
    } catch (error) {
      console.error('[ROLES_API] Error assigning role:', error);
      
      if (error.message.includes('already has role')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to assign role'
      });
    }
  }
);

/**
 * @route DELETE /api/roles/remove
 * @desc Rimuove un ruolo da un utente
 * @access Admin with user management permissions
 */
router.delete('/remove',
  enhancedRoleService.requirePermission('users.manage_roles'),
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const { userId, roleType, companyId } = req.body;

      if (!userId || !roleType) {
        return res.status(400).json({
          success: false,
          error: 'User ID and role type are required'
        });
      }

      const success = await enhancedRoleService.removeRole(
        userId,
        tenantId,
        roleType,
        companyId || null
      );

      if (success) {
        res.json({
          success: true,
          message: 'Role removed successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Role assignment not found'
        });
      }
    } catch (error) {
      console.error('[ROLES_API] Error removing role:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove role'
      });
    }
  }
);

/**
 * @route GET /api/roles/user/:userId
 * @desc Ottiene tutti i ruoli di un utente specifico
 * @access Admin or Self
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tenantId = req.tenant.id;
    const currentUser = req.user;

    // Verifica permessi: può vedere i propri ruoli o essere admin
    const canView = currentUser.id === userId || 
      await enhancedRoleService.hasPermission(currentUser.id, 'users.read', { tenantId });

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const [roles, permissions] = await Promise.all([
      enhancedRoleService.getUserRoles(userId, tenantId),
      enhancedRoleService.getUserPermissions(userId, tenantId)
    ]);

    res.json({
      success: true,
      data: {
        userId,
        roles,
        permissions,
        effectivePermissions: permissions.map(p => p.permission)
      }
    });
  } catch (error) {
    console.error('[ROLES_API] Error getting user roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user roles'
    });
  }
});

/**
 * @route PUT /api/roles/user/:userId/permissions
 * @desc Aggiorna le permissioni personalizzate di un utente
 * @access Admin with user management permissions
 */
router.put('/user/:userId/permissions',
  enhancedRoleService.requirePermission('users.manage_roles'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.tenant.id;
      const { roleType, companyId, customPermissions } = req.body;

      if (!roleType) {
        return res.status(400).json({
          success: false,
          error: 'Role type is required'
        });
      }

      // Validazione permissioni personalizzate
      if (customPermissions) {
        const validPermissions = Object.keys(enhancedRoleService.PERMISSIONS);
        const invalidPermissions = customPermissions.filter(p => !validPermissions.includes(p));
        
        if (invalidPermissions.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid permissions: ${invalidPermissions.join(', ')}`
          });
        }
      }

      const success = await enhancedRoleService.updateRolePermissions(
        userId,
        tenantId,
        roleType,
        companyId || null,
        customPermissions || []
      );

      if (success) {
        res.json({
          success: true,
          message: 'Permissions updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Role assignment not found'
        });
      }
    } catch (error) {
      console.error('[ROLES_API] Error updating permissions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update permissions'
      });
    }
  }
);

/**
 * @route POST /api/roles/cleanup
 * @desc Pulisce i ruoli scaduti
 * @access Admin
 */
router.post('/cleanup',
  enhancedRoleService.requirePermission('system.maintenance'),
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const cleanedCount = await enhancedRoleService.cleanupExpiredRoles(tenantId);

      res.json({
        success: true,
        data: {
          cleanedRoles: cleanedCount
        },
        message: `Cleaned up ${cleanedCount} expired roles`
      });
    } catch (error) {
      console.error('[ROLES_API] Error cleaning up roles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired roles'
      });
    }
  }
);

/**
 * @route GET /api/roles/check/:permission
 * @desc Verifica se l'utente corrente ha una specifica permissione
 * @access Authenticated
 */
router.get('/check/:permission', async (req, res) => {
  try {
    const { permission } = req.params;
    const userId = req.user.id;
    const tenantId = req.tenant.id;
    const { companyId, departmentId } = req.query;

    const context = { tenantId };
    if (companyId) context.companyId = companyId;
    if (departmentId) context.departmentId = departmentId;

    const hasPermission = await enhancedRoleService.hasPermission(
      userId,
      permission,
      context
    );

    res.json({
      success: true,
      data: {
        permission,
        hasPermission,
        context
      }
    });
  } catch (error) {
    console.error('[ROLES_API] Error checking permission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check permission'
    });
  }
});

export default router;