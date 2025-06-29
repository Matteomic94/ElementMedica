import express from 'express';
const router = express.Router();
import tenantService from '../services/tenantService.js';
import enhancedRoleService from '../services/enhancedRoleService.js';
import { tenantMiddleware, validateUserTenant, requireSuperAdmin } from '../middleware/tenant.js';
import middleware from '../auth/middleware.js';
const { authenticate: authenticateToken } = middleware;

/**
 * Routes per la gestione dei tenant
 * Week 12: Sistema Utenti Avanzato
 */

// Middleware di autenticazione per tutte le routes
router.use(authenticateToken());

/**
 * @route GET /api/tenants
 * @desc Lista tutti i tenant (solo super admin)
 * @access Super Admin
 */
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, is_active, billing_plan } = req.query;
    
    const filters = {};
    if (search) filters.search = search;
    if (is_active !== undefined) filters.is_active = is_active === 'true';
    if (billing_plan) filters.billing_plan = billing_plan;

    const result = await tenantService.listAllTenants(
      parseInt(page),
      parseInt(limit),
      filters
    );

    res.json({
      success: true,
      data: result.tenants,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[TENANTS_API] Error listing tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tenants',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/tenants
 * @desc Crea un nuovo tenant (solo super admin)
 * @access Super Admin
 */
router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const { name, slug, domain, settings, billing_plan } = req.body;

    // Validazione input
    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        error: 'Name and slug are required'
      });
    }

    // Validazione slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Slug must contain only lowercase letters, numbers, and hyphens'
      });
    }

    const tenant = await tenantService.createTenant({
      name,
      slug,
      domain,
      settings,
      billing_plan
    });

    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    console.error('[TENANTS_API] Error creating tenant:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create tenant',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/tenants/current
 * @desc Ottiene informazioni sul tenant corrente
 * @access Authenticated
 */
router.get('/current', tenantMiddleware, validateUserTenant, async (req, res) => {
  try {
    const tenant = req.tenant;
    
    // Ottieni statistiche del tenant
    const stats = await tenantService.getTenantStats(tenant.id);
    
    // Ottieni limiti del piano
    const billingInfo = await tenantService.checkBillingLimits(tenant.id);

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.ragione_sociale,
          slug: tenant.slug,
          domain: tenant.domain,
          settings: tenant.settings,
          subscription_plan: tenant.subscription_plan,
          is_active: tenant.is_active,
          created_at: tenant.created_at
        },
        statistics: stats,
        billing: billingInfo
      }
    });
  } catch (error) {
    console.error('[TENANTS_API] Error getting current tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenant information'
    });
  }
});

/**
 * @route GET /api/tenants/:id
 * @desc Ottiene un tenant specifico
 * @access Super Admin or Tenant Admin
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Verifica permessi
    if (user.globalRole !== 'SUPER_ADMIN' && user.companyId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const tenant = await tenantService.getTenantById(id);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Ottieni statistiche se autorizzato
    let stats = null;
    if (user.globalRole === 'SUPER_ADMIN' || user.companyId === id) {
      stats = await tenantService.getTenantStats(id);
    }

    res.json({
      success: true,
      data: {
        tenant,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('[TENANTS_API] Error getting tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenant'
    });
  }
});

/**
 * @route PUT /api/tenants/:id
 * @desc Aggiorna un tenant
 * @access Super Admin or Tenant Admin
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;

    // Verifica permessi
    const isSuperAdmin = user.globalRole === 'SUPER_ADMIN';
    const isTenantAdmin = user.companyId === id && 
      await enhancedRoleService.hasPermission(user.id, 'companies.update', { tenantId: id });

    if (!isSuperAdmin && !isTenantAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Limita i campi che possono essere modificati da tenant admin
    if (!isSuperAdmin) {
      const allowedFields = ['name', 'settings'];
      const filteredData = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });
      updateData = filteredData;
    }

    const updatedTenant = await tenantService.updateTenant(id, updateData);

    res.json({
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    console.error('[TENANTS_API] Error updating tenant:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update tenant'
    });
  }
});

/**
 * @route DELETE /api/tenants/:id
 * @desc Elimina un tenant (solo super admin)
 * @access Super Admin
 */
router.delete('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await tenantService.deleteTenant(id);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('[TENANTS_API] Error deleting tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tenant'
    });
  }
});

/**
 * @route GET /api/tenants/:id/stats
 * @desc Ottiene statistiche dettagliate di un tenant
 * @access Super Admin or Tenant Admin
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Verifica permessi
    if (user.globalRole !== 'SUPER_ADMIN' && user.companyId !== id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const [stats, billingInfo, roleStats] = await Promise.all([
      tenantService.getTenantStats(id),
      tenantService.checkBillingLimits(id),
      enhancedRoleService.getRoleStatistics(id)
    ]);

    res.json({
      success: true,
      data: {
        usage: stats,
        billing: billingInfo,
        roles: roleStats
      }
    });
  } catch (error) {
    console.error('[TENANTS_API] Error getting tenant stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenant statistics'
    });
  }
});

/**
 * @route POST /api/tenants/:id/users/:userId/roles
 * @desc Assegna un ruolo a un utente nel tenant
 * @access Tenant Admin with user management permissions
 */
router.post('/:id/users/:userId/roles', 
  enhancedRoleService.requirePermission('users.manage_roles'),
  async (req, res) => {
    try {
      const { id: tenantId, userId } = req.params;
      const { roleType, companyId, departmentId, expiresAt, customPermissions } = req.body;

      if (!roleType) {
        return res.status(400).json({
          success: false,
          error: 'Role type is required'
        });
      }

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
      console.error('[TENANTS_API] Error assigning role:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign role'
      });
    }
  }
);

/**
 * @route DELETE /api/tenants/:id/users/:userId/roles/:roleType
 * @desc Rimuove un ruolo da un utente
 * @access Tenant Admin with user management permissions
 */
router.delete('/:id/users/:userId/roles/:roleType',
  enhancedRoleService.requirePermission('users.manage_roles'),
  async (req, res) => {
    try {
      const { id: tenantId, userId, roleType } = req.params;
      const { companyId } = req.query;

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
          error: 'Role not found'
        });
      }
    } catch (error) {
      console.error('[TENANTS_API] Error removing role:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove role'
      });
    }
  }
);

/**
 * @route GET /api/tenants/:id/users/:userId/roles
 * @desc Ottiene tutti i ruoli di un utente
 * @access Tenant Admin or Self
 */
router.get('/:id/users/:userId/roles', async (req, res) => {
  try {
    const { id: tenantId, userId } = req.params;
    const user = req.user;

    // Verifica permessi: può vedere i propri ruoli o essere admin
    const canView = user.id === userId || 
      await enhancedRoleService.hasPermission(user.id, 'users.read', { tenantId });

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const roles = await enhancedRoleService.getUserRoles(userId, tenantId);
    const permissions = await enhancedRoleService.getUserPermissions(userId, tenantId);

    res.json({
      success: true,
      data: {
        roles,
        permissions
      }
    });
  } catch (error) {
    console.error('[TENANTS_API] Error getting user roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user roles'
    });
  }
});

export default router;