import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

class PersonService {
  // Ottieni persone per ruolo
  async getPersonsByRole(roleType, filters = {}) {
    try {
      const where = {
        isDeleted: false,
        personRoles: {
          some: {
            roleType: Array.isArray(roleType) ? { in: roleType } : roleType,
            isActive: true
          }
        },
        ...filters
      };
      
      return await prisma.person.findMany({
        where,
        include: {
          personRoles: {
            where: { isActive: true },
            include: {
              company: true,
              tenant: true
            }
          },
          company: true,
          tenant: true
        },
        orderBy: {
          lastName: 'asc'
        }
      });
    } catch (error) {
      logger.error('Error getting persons by role:', { error: error.message, roleType });
      throw error;
    }
  }
  
  // Ottieni dipendenti (backward compatibility)
  async getEmployees(filters = {}) {
    return this.getPersonsByRole('EMPLOYEE', filters);
  }
  
  // Ottieni formatori (backward compatibility)
  async getTrainers(filters = {}) {
    return this.getPersonsByRole('TRAINER', filters);
  }
  
  // Ottieni utenti sistema (backward compatibility)
  async getSystemUsers(filters = {}) {
    return this.getPersonsByRole(['ADMIN', 'COMPANY_ADMIN', 'MANAGER'], filters);
  }
  
  // Ottieni persona per ID
  async getPersonById(id) {
    try {
      return await prisma.person.findUnique({
        where: { id },
        include: {
          personRoles: {
            where: { isActive: true },
            include: {
              company: true,
              tenant: true
            }
          },
          company: true,
          tenant: true
        }
      });
    } catch (error) {
      logger.error('Error getting person by ID:', { error: error.message, id });
      throw error;
    }
  }
  
  // Crea persona con ruolo
  async createPerson(data, roleType, companyId = null, tenantId = null) {
    try {
      const { roles, ...personData } = data;
      
      return await prisma.person.create({
        data: {
          ...personData,
          companyId,
          tenantId,
          personRoles: {
            create: {
              roleType: roleType,
              isActive: true,
              isPrimary: true,
              companyId,
              tenantId
            }
          }
        },
        include: {
          personRoles: {
            include: {
              company: true,
              tenant: true
            }
          },
          company: true,
          tenant: true
        }
      });
    } catch (error) {
      logger.error('Error creating person:', { error: error.message, data });
      throw error;
    }
  }
  
  // Aggiorna persona
  async updatePerson(id, data) {
    try {
      const { roles, ...personData } = data;
      
      return await prisma.person.update({
        where: { id },
        data: {
          ...personData,
          updatedAt: new Date()
        },
        include: {
          personRoles: {
            where: { isActive: true },
            include: {
              company: true,
              tenant: true
            }
          },
          company: true,
          tenant: true
        }
      });
    } catch (error) {
      logger.error('Error updating person:', { error: error.message, id, data });
      throw error;
    }
  }
  
  // Soft delete
  async deletePerson(id) {
    try {
      return await prisma.person.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false
        }
      });
    } catch (error) {
      logger.error('Error deleting person:', { error: error.message, id });
      throw error;
    }
  }
  
  // Aggiungi ruolo a persona
  async addRole(personId, roleType, companyId = null, tenantId = null) {
    try {
      // Verifica se il ruolo esiste già
      const existingRole = await prisma.personRole.findFirst({
        where: {
          personId,
          roleType,
          companyId,
          tenantId,
          isActive: true
        }
      });
      
      if (existingRole) {
        throw new Error('Role already exists for this person');
      }
      
      return await prisma.personRole.create({
        data: {
          personId,
          roleType,
          isActive: true,
          companyId,
          tenantId
        },
        include: {
          person: true,
          company: true,
          tenant: true
        }
      });
    } catch (error) {
      logger.error('Error adding role:', { error: error.message, personId, roleType });
      throw error;
    }
  }
  
  // Rimuovi ruolo da persona
  async removeRole(personId, roleType, companyId = null, tenantId = null) {
    try {
      return await prisma.personRole.updateMany({
        where: {
          personId,
          roleType,
          companyId,
          tenantId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });
    } catch (error) {
      logger.error('Error removing role:', { error: error.message, personId, roleType });
      throw error;
    }
  }
  
  // Cerca persone
  async searchPersons(query, roleType = null, filters = {}) {
    try {
      const where = {
        isDeleted: false,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ],
        ...filters
      };
      
      if (roleType) {
        where.personRoles = {
          some: {
            roleType: Array.isArray(roleType) ? { in: roleType } : roleType,
            isActive: true
          }
        };
      }
      
      return await prisma.person.findMany({
        where,
        include: {
          personRoles: {
            where: { isActive: true },
            include: {
              company: true,
              tenant: true
            }
          },
          company: true,
          tenant: true
        },
        orderBy: {
          lastName: 'asc'
        }
      });
    } catch (error) {
      logger.error('Error searching persons:', { error: error.message, query });
      throw error;
    }
  }
}

export default new PersonService();