import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Middleware per la risoluzione del tenant
 * Identifica il tenant basandosi su domain/subdomain e imposta il contesto
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // Skip tenant resolution for global admin endpoints
    if (req.path.startsWith('/api/admin/global')) {
      return next();
    }

    // Get host from request
    const host = req.get('host') || req.get('x-forwarded-host');
    if (!host) {
      return res.status(400).json({ 
        error: 'Host header required for tenant resolution' 
      });
    }

    let company = null;
    
    // Try to resolve tenant by custom domain first
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      company = await prisma.company.findFirst({
        where: {
          domain: host,
          is_active: true,
          eliminato: false
        }
      });
    }

    // If not found by domain, try subdomain resolution
    if (!company) {
      const subdomain = host.split('.')[0];
      
      // Skip if it's the main domain or localhost
      if (subdomain && subdomain !== 'www' && subdomain !== 'api' && !host.includes('localhost')) {
        company = await prisma.company.findFirst({
          where: {
            slug: subdomain,
            is_active: true,
            eliminato: false
          }
        });
      }
    }

    // For development/localhost, try to get tenant from header or query
    if (!company && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
      if (tenantId) {
        company = await prisma.company.findFirst({
          where: {
            OR: [
              { id: tenantId },
              { slug: tenantId }
            ],
            is_active: true,
            eliminato: false
          }
        });
      }
    }

    // If still no tenant found, check if this is a global admin request
    if (!company) {
      // Allow access to auth endpoints without tenant
      if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/health')) {
        return next();
      }
      
      return res.status(404).json({ 
        error: 'Tenant not found or inactive',
        host: host,
        path: req.path
      });
    }

    // Set tenant context in request
    req.tenant = company;
    req.tenantId = company.id;

    // Set database context for Row Level Security
    await prisma.$executeRaw`SELECT set_config('app.current_tenant', ${company.id}, true)`;

    console.log(`[TENANT] Resolved tenant: ${company.ragione_sociale} (${company.id}) for host: ${host}`);
    
    next();
  } catch (error) {
    console.error('[TENANT] Error resolving tenant:', error);
    res.status(500).json({ 
      error: 'Tenant resolution failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware per verificare che l'utente appartenga al tenant corrente
 */
const validateUserTenant = async (req, res, next) => {
  try {
    const user = req.user;
    const tenant = req.tenant;

    if (!user || !tenant) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Super admin can access any tenant
    if (user.globalRole === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user belongs to the current tenant
    if (user.companyId !== tenant.id) {
      return res.status(403).json({ 
        error: 'Access denied: User does not belong to this tenant',
        userTenant: user.companyId,
        requestTenant: tenant.id
      });
    }

    next();
  } catch (error) {
    console.error('[TENANT] Error validating user tenant:', error);
    res.status(500).json({ error: 'Tenant validation failed' });
  }
};

/**
 * Utility function per ottenere il contesto tenant corrente
 */
const getCurrentTenant = (req) => {
  return req.tenant;
};

/**
 * Utility function per verificare se l'utente è super admin
 */
const isSuperAdmin = (user) => {
  return user && user.globalRole === 'SUPER_ADMIN';
};

/**
 * Middleware per endpoints che richiedono super admin
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !isSuperAdmin(req.user)) {
    return res.status(403).json({ 
      error: 'Super admin access required' 
    });
  }
  next();
};

export {
  tenantMiddleware,
  validateUserTenant,
  getCurrentTenant,
  isSuperAdmin,
  requireSuperAdmin
};