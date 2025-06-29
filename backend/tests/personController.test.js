/**
 * Test suite for PersonController
 * Tests the unified person management functionality
 */

import { jest } from '@jest/globals';
import { PersonController } from '../controllers/personController.js';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  person: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  personRole: {
    create: jest.fn(),
    deleteMany: jest.fn()
  }
};

// Mock request and response objects
const mockReq = {
  user: { id: 1, companyId: 1 },
  params: {},
  body: {},
  query: {}
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
};

const mockNext = jest.fn();

describe('PersonController', () => {
  let personController;

  beforeEach(() => {
    personController = new PersonController(mockPrisma);
    jest.clearAllMocks();
  });

  describe('getEmployees', () => {
    it('should return employees with proper transformation', async () => {
      const mockEmployees = [
        {
          id: 1,
          nome: 'Mario',
          cognome: 'Rossi',
          codice_fiscale: 'RSSMRA80A01H501Z',
          companyId: 1,
          personRoles: [{ roleType: 'EMPLOYEE' }]
        }
      ];

      mockPrisma.person.findMany.mockResolvedValue(mockEmployees);

      await personController.getEmployees(mockReq, mockRes, mockNext);

      expect(mockPrisma.person.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 1,
          personRoles: {
            some: { roleType: 'EMPLOYEE' }
          },
          deleted_at: null
        },
        include: {
          company: true,
          personRoles: true
        },
        orderBy: { cognome: 'asc' }
      });

      expect(mockRes.json).toHaveBeenCalledWith([
        {
          id: 1,
          nome: 'Mario',
          cognome: 'Rossi',
          codice_fiscale: 'RSSMRA80A01H501Z',
          company_id: 1,
          personRoles: [{ roleType: 'EMPLOYEE' }]
        }
      ]);
    });
  });

  describe('getTrainers', () => {
    it('should return trainers with proper transformation', async () => {
      const mockTrainers = [
        {
          id: 2,
          nome: 'Luigi',
          cognome: 'Verdi',
          codice_fiscale: 'VRDLGU75B15F205X',
          companyId: 1,
          personRoles: [{ roleType: 'TRAINER' }]
        }
      ];

      mockPrisma.person.findMany.mockResolvedValue(mockTrainers);

      await personController.getTrainers(mockReq, mockRes, mockNext);

      expect(mockPrisma.person.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 1,
          personRoles: {
            some: { roleType: 'TRAINER' }
          },
          deleted_at: null
        },
        include: {
          company: true,
          personRoles: true
        },
        orderBy: { cognome: 'asc' }
      });

      expect(mockRes.json).toHaveBeenCalledWith([
        {
          id: 2,
          nome: 'Luigi',
          cognome: 'Verdi',
          codice_fiscale: 'VRDLGU75B15F205X',
          company_id: 1,
          personRoles: [{ roleType: 'TRAINER' }]
        }
      ]);
    });
  });

  describe('createPerson', () => {
    it('should create a person with role', async () => {
      const mockPersonData = {
        nome: 'Anna',
        cognome: 'Bianchi',
        codice_fiscale: 'BNCNNA85C45H501Y',
        roleType: 'EMPLOYEE'
      };

      const mockCreatedPerson = {
        id: 3,
        nome: 'Anna',
        cognome: 'Bianchi',
        codice_fiscale: 'BNCNNA85C45H501Y',
        companyId: 1,
        personRoles: [{ roleType: 'EMPLOYEE' }]
      };

      mockReq.body = mockPersonData;
      mockPrisma.person.create.mockResolvedValue(mockCreatedPerson);

      await personController.createPerson(mockReq, mockRes, mockNext);

      expect(mockPrisma.person.create).toHaveBeenCalledWith({
        data: {
          nome: 'Anna',
          cognome: 'Bianchi',
          codice_fiscale: 'BNCNNA85C45H501Y',
          companyId: 1,
          personRoles: {
            create: {
              roleType: 'EMPLOYEE'
            }
          }
        },
        include: {
          company: true,
          personRoles: true
        }
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 3,
        nome: 'Anna',
        cognome: 'Bianchi',
        codice_fiscale: 'BNCNNA85C45H501Y',
        company_id: 1,
        personRoles: [{ roleType: 'EMPLOYEE' }]
      });
    });
  });

  describe('updatePerson', () => {
    it('should update a person', async () => {
      const mockPersonData = {
        nome: 'Mario Updated',
        cognome: 'Rossi Updated'
      };

      const mockUpdatedPerson = {
        id: 1,
        nome: 'Mario Updated',
        cognome: 'Rossi Updated',
        codice_fiscale: 'RSSMRA80A01H501Z',
        companyId: 1,
        personRoles: [{ roleType: 'EMPLOYEE' }]
      };

      mockReq.params.id = '1';
      mockReq.body = mockPersonData;
      mockPrisma.person.update.mockResolvedValue(mockUpdatedPerson);

      await personController.updatePerson(mockReq, mockRes, mockNext);

      expect(mockPrisma.person.update).toHaveBeenCalledWith({
        where: {
          id: 1,
          companyId: 1,
          deleted_at: null
        },
        data: {
          nome: 'Mario Updated',
          cognome: 'Rossi Updated'
        },
        include: {
          company: true,
          personRoles: true
        }
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        nome: 'Mario Updated',
        cognome: 'Rossi Updated',
        codice_fiscale: 'RSSMRA80A01H501Z',
        company_id: 1,
        personRoles: [{ roleType: 'EMPLOYEE' }]
      });
    });
  });

  describe('deletePerson', () => {
    it('should soft delete a person', async () => {
      const mockDeletedPerson = {
        id: 1,
        nome: 'Mario',
        cognome: 'Rossi',
        deleted_at: new Date(),
        deleted_by: 1
      };

      mockReq.params.id = '1';
      mockPrisma.person.update.mockResolvedValue(mockDeletedPerson);

      await personController.deletePerson(mockReq, mockRes, mockNext);

      expect(mockPrisma.person.update).toHaveBeenCalledWith({
        where: {
          id: 1,
          companyId: 1,
          deleted_at: null
        },
        data: {
          deleted_at: expect.any(Date),
          deleted_by: 1,
          is_active: false
        }
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Person deleted successfully'
      });
    });
  });

  describe('addRole', () => {
    it('should add a role to a person', async () => {
      const mockRole = {
        id: 1,
        personId: 1,
        roleType: 'TRAINER'
      };

      mockReq.params.id = '1';
      mockReq.body = { roleType: 'TRAINER' };
      mockPrisma.personRole.create.mockResolvedValue(mockRole);

      await personController.addRole(mockReq, mockRes, mockNext);

      expect(mockPrisma.personRole.create).toHaveBeenCalledWith({
        data: {
          personId: 1,
          roleType: 'TRAINER'
        }
      });

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockRole);
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a person', async () => {
      mockReq.params.id = '1';
      mockReq.body = { roleType: 'TRAINER' };
      mockPrisma.personRole.deleteMany.mockResolvedValue({ count: 1 });

      await personController.removeRole(mockReq, mockRes, mockNext);

      expect(mockPrisma.personRole.deleteMany).toHaveBeenCalledWith({
        where: {
          personId: 1,
          roleType: 'TRAINER'
        }
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Role removed successfully'
      });
    });
  });
});