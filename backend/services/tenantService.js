import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class TenantService {
  /**
   * Crea un nuovo tenant
   */
  async createTenant(tenantData) {
    try {
      const { name, slug, domain, settings = {}, billing_plan = 'basic' } = tenantData;

      // Verifica che lo slug sia unico
      const existingTenant = await prisma.company.findFirst({
        where: {
          OR: [
            { slug: slug },
            { domain: domain }
          ]
        }
      });

      if (existingTenant) {
        throw new Error('Tenant with this slug or domain already exists');
      }

      // Crea il tenant
      const tenant = await prisma.company.create({
        data: {
          ragione_sociale: name,
          slug,
          domain,
          settings,
          subscription_plan: billing_plan,
          is_active: true,
          eliminato: false
        }
      });

      // Crea configurazioni di default
      await this.createDefaultConfigurations(tenant.id);

      // Crea ruoli di default
      await this.createDefaultRoles(tenant.id);

      return tenant;
    } catch (error) {
      console.error('[TENANT_SERVICE] Error creating tenant:', error);
      throw error;
    }
  }

  /**
   * Ottiene un tenant per ID
   */
  async getTenantById(tenantId) {
    try {
      return await prisma.company.findUnique({
        where: {
          id: tenantId,
          eliminato: false
        },
        include: {
          users: {
            where: { eliminato: false },
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true
            }
          },
          roles: {
            where: { eliminato: false }
          }
        }
      });
    } catch (error) {
      console.error('[TENANT_SERVICE] Error getting tenant:', error);
      throw error;
    }
  }

  /**
   * Ottiene un tenant per slug
   */
  async getTenantBySlug(slug) {
    try {
      return await prisma.company.findFirst({
        where: {
          slug,
          is_active: true,
          eliminato: false
        }
      });
    } catch (error) {
      console.error('[TENANT_SERVICE] Error getting tenant by slug:', error);
      throw error;
    }
  }

  /**
   * Ottiene un tenant per dominio
   */
  async getTenantByDomain(domain) {
    try {
      return await prisma.company.findFirst({
        where: {
          domain,
          is_active: true,
          eliminato: false
        }
      });
    } catch (error) {
      console.error('[TENANT_SERVICE] Error getting tenant by domain:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un tenant
   */
  async updateTenant(tenantId, updateData) {
    try {
      const { name, slug, domain, settings, billing_plan, is_active } = updateData;

      // Verifica che slug e domain siano unici (se modificati)
      if (slug || domain) {
        const existingTenant = await prisma.company.findFirst({
          where: {
            AND: [
              { id: { not: tenantId } },
              {
                OR: [
                  slug ? { slug } : {},
                  domain ? { domain } : {}
                ].filter(condition => Object.keys(condition).length > 0)
              }
            ]
          }
        });

        if (existingTenant) {
          throw new Error('Another tenant with this slug or domain already exists');
        }
      }

      const updatePayload = {};
      if (name) updatePayload.ragione_sociale = name;
      if (slug) updatePayload.slug = slug;
      if (domain) updatePayload.domain = domain;
      if (settings) updatePayload.settings = settings;
      if (billing_plan) updatePayload.subscription_plan = billing_plan;
      if (typeof is_active === 'boolean') updatePayload.is_active = is_active;

      return await prisma.company.update({
        where: { id: tenantId },
        data: updatePayload
      });
    } catch (error) {
      console.error('[TENANT_SERVICE] Error updating tenant:', error);
      throw error;
    }
  }

  /**
   * Elimina un tenant (soft delete)
   */
  async deleteTenant(tenantId) {
    try {
      // Disattiva prima il tenant
      await prisma.company.update({
        where: { id: tenantId },
        data: {
          is_active: false,
          eliminato: true
        }
      });

      // Disattiva tutti gli utenti del tenant
      await prisma.user.updateMany({
        where: { companyId: tenantId },
        data: {
          isActive: false,
          eliminato: true
        }
      });

      return { success: true, message: 'Tenant deleted successfully' };
    } catch (error) {
      console.error('[TENANT_SERVICE] Error deleting tenant:', error);
      throw error;
    }
  }

  /**
   * Ottiene le statistiche di un tenant
   */
  async getTenantStats(tenantId) {
    try {
      const [userCount, employeeCount, courseCount, trainerCount] = await Promise.all([
        prisma.user.count({
          where: {
            companyId: tenantId,
            eliminato: false
          }
        }),
        prisma.employee.count({
          where: {
            companyId: tenantId,
            eliminato: false
          }
        }),
        prisma.course.count({
          where: {
            tenant_id: tenantId,
            eliminato: false
          }
        }),
        prisma.trainer.count({
          where: {
            tenant_id: tenantId,
            eliminato: false
          }
        })
      ]);

      return {
        users: userCount,
        employees: employeeCount,
        courses: courseCount,
        trainers: trainerCount
      };
    } catch (error) {
      console.error('[TENANT_SERVICE] Error getting tenant stats:', error);
      throw error;
    }
  }

  /**
   * Crea configurazioni di default per un nuovo tenant
   */
  async createDefaultConfigurations(tenantId) {
    try {
      const defaultConfigs = [
        {
          tenant_id: tenantId,
          config_key: 'theme',
          config_value: { theme: 'default' },
          config_type: 'ui'
        },
        {
          tenant_id: tenantId,
          config_key: 'locale',
          config_value: { locale: 'it-IT' },
          config_type: 'general'
        },
        {
          tenant_id: tenantId,
          config_key: 'timezone',
          config_value: { timezone: 'Europe/Rome' },
          config_type: 'general'
        },
        {
          tenant_id: tenantId,
          config_key: 'max_file_size',
          config_value: { size: 10485760 }, // 10MB
          config_type: 'general'
        },
        {
          tenant_id: tenantId,
          config_key: 'session_timeout',
          config_value: { timeout: 3600 }, // 1 hour
          config_type: 'security'
        }
      ];

      // Note: Questa implementazione presuppone che esista una tabella tenant_configurations
      // Per ora salviamo nelle settings del tenant
      const settings = defaultConfigs.reduce((acc, config) => {
        acc[config.config_key] = config.config_value;
        return acc;
      }, {});

      await prisma.company.update({
        where: { id: tenantId },
        data: { settings }
      });

      return defaultConfigs;
    } catch (error) {
      console.error('[TENANT_SERVICE] Error creating default configurations:', error);
      throw error;
    }
  }

  /**
   * Crea ruoli di default per un nuovo tenant
   */
  async createDefaultRoles(tenantId) {
    try {
      const defaultRoles = [
        {
          name: 'company_admin',
          description: 'Amministratore della company',
          companyId: tenantId,
          eliminato: false
        },
        {
          name: 'manager',
          description: 'Manager aziendale',
          companyId: tenantId,
          eliminato: false
        },
        {
          name: 'trainer',
          description: 'Formatore',
          companyId: tenantId,
          eliminato: false
        },
        {
          name: 'employee',
          description: 'Dipendente',
          companyId: tenantId,
          eliminato: false
        }
      ];

      const createdRoles = [];
      for (const roleData of defaultRoles) {
        const role = await prisma.role.create({
          data: roleData
        });
        createdRoles.push(role);
      }

      return createdRoles;
    } catch (error) {
      console.error('[TENANT_SERVICE] Error creating default roles:', error);
      throw error;
    }
  }

  /**
   * Verifica i limiti del piano di billing
   */
  async checkBillingLimits(tenantId) {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const stats = await this.getTenantStats(tenantId);
      
      const limits = {
        basic: { users: 10, companies: 1, courses: 50 },
        professional: { users: 50, companies: 5, courses: 200 },
        enterprise: { users: 500, companies: 50, courses: 1000 }
      };

      const planLimits = limits[tenant.subscription_plan] || limits.basic;
      
      return {
        plan: tenant.subscription_plan,
        limits: planLimits,
        usage: stats,
        withinLimits: {
          users: stats.users <= planLimits.users,
          courses: stats.courses <= planLimits.courses
        }
      };
    } catch (error) {
      console.error('[TENANT_SERVICE] Error checking billing limits:', error);
      throw error;
    }
  }

  /**
   * Lista tutti i tenant (solo per super admin)
   */
  async listAllTenants(page = 1, limit = 20, filters = {}) {
    try {
      const skip = (page - 1) * limit;
      const where = {
        eliminato: false,
        ...(filters.is_active !== undefined && { is_active: filters.is_active }),
        ...(filters.billing_plan && { subscription_plan: filters.billing_plan }),
        ...(filters.search && {
          OR: [
            { ragione_sociale: { contains: filters.search, mode: 'insensitive' } },
            { slug: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      };

      const [tenants, total] = await Promise.all([
        prisma.company.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            ragione_sociale: true,
            slug: true,
            domain: true,
            subscription_plan: true,
            is_active: true,
            created_at: true,
            _count: {
              select: {
                users: { where: { eliminato: false } },
                employees: { where: { eliminato: false } }
              }
            }
          }
        }),
        prisma.company.count({ where })
      ]);

      return {
        tenants,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('[TENANT_SERVICE] Error listing tenants:', error);
      throw error;
    }
  }
}

export default new TenantService();