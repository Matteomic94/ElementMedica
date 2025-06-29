import { validationResult } from 'express-validator';
import personService from '../services/personService.js';
import logger from '../utils/logger.js';

class PersonController {
  // GET /api/persons/employees
  async getEmployees(req, res) {
    try {
      const { companyId, tenantId, search, ...filters } = req.query;
      
      const queryFilters = {};
      if (companyId) queryFilters.companyId = companyId;
      if (tenantId) queryFilters.tenantId = tenantId;
      
      let employees;
      if (search) {
        employees = await personService.searchPersons(search, 'EMPLOYEE', queryFilters);
      } else {
        employees = await personService.getEmployees(queryFilters);
      }
      
      // Trasforma i dati per backward compatibility
      const transformedEmployees = employees.map(person => ({
        id: person.id,
        first_name: person.firstName,
        last_name: person.lastName,
        email: person.email,
        phone: person.phone,
        codice_fiscale: person.taxCode,
        birth_date: person.birthDate,
        residence_address: person.residenceAddress,
        residence_city: person.residenceCity,
        postal_code: person.postalCode,
        province: person.province,
        title: person.title,
        hired_date: person.hiredDate,
        company_id: person.companyId,
        companyId: person.companyId,
        company: person.company,
        is_active: person.isActive,
        created_at: person.createdAt,
        updated_at: person.updatedAt
      }));
      
      res.json(transformedEmployees);
    } catch (error) {
      logger.error('Error getting employees:', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
  
  // GET /api/persons/trainers
  async getTrainers(req, res) {
    try {
      const { companyId, tenantId, search, ...filters } = req.query;
      
      const queryFilters = {};
      if (companyId) queryFilters.companyId = companyId;
      if (tenantId) queryFilters.tenantId = tenantId;
      
      let trainers;
      if (search) {
        trainers = await personService.searchPersons(search, 'TRAINER', queryFilters);
      } else {
        trainers = await personService.getTrainers(queryFilters);
      }
      
      // Trasforma i dati per backward compatibility
      const transformedTrainers = trainers.map(person => ({
        id: person.id,
        first_name: person.firstName,
        last_name: person.lastName,
        email: person.email,
        phone: person.phone,
        codice_fiscale: person.taxCode,
        birth_date: person.birthDate,
        residence_address: person.residenceAddress,
        residence_city: person.residenceCity,
        postal_code: person.postalCode,
        province: person.province,
        hourly_rate: person.hourlyRate,
        iban: person.iban,
        register_code: person.registerCode,
        certifications: person.certifications,
        specialties: person.specialties,
        vat_number: person.vatNumber,
        is_active: person.isActive,
        created_at: person.createdAt,
        updated_at: person.updatedAt
      }));
      
      res.json(transformedTrainers);
    } catch (error) {
      logger.error('Error getting trainers:', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
  
  // GET /api/persons/users
  async getSystemUsers(req, res) {
    try {
      const { companyId, tenantId, search, ...filters } = req.query;
      
      const queryFilters = {};
      if (companyId) queryFilters.companyId = companyId;
      if (tenantId) queryFilters.tenantId = tenantId;
      
      let users;
      if (search) {
        users = await personService.searchPersons(search, ['ADMIN', 'COMPANY_ADMIN', 'MANAGER'], queryFilters);
      } else {
        users = await personService.getSystemUsers(queryFilters);
      }
      
      // Trasforma i dati per backward compatibility
      const transformedUsers = users.map(person => ({
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        username: person.username,
        globalRole: person.globalRole,
        isActive: person.isActive,
        lastLogin: person.lastLogin,
        failedAttempts: person.failedAttempts,
        lockedUntil: person.lockedUntil,
        companyId: person.companyId,
        tenantId: person.tenantId,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt
      }));
      
      res.json(transformedUsers);
    } catch (error) {
      logger.error('Error getting system users:', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
  
  // GET /api/persons/:id
  async getPersonById(req, res) {
    try {
      const { id } = req.params;
      const person = await personService.getPersonById(id);
      
      if (!person) {
        return res.status(404).json({ error: 'Person not found' });
      }
      
      res.json(person);
    } catch (error) {
      logger.error('Error getting person by ID:', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }
  
  // POST /api/persons
  async createPerson(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { roleType, companyId, tenantId, ...personData } = req.body;
      
      // Trasforma i campi da snake_case a camelCase se necessario
      const transformedData = {
        firstName: personData.firstName || personData.first_name,
        lastName: personData.lastName || personData.last_name,
        email: personData.email,
        phone: personData.phone,
        taxCode: personData.taxCode || personData.codice_fiscale,
        birthDate: personData.birthDate || personData.birth_date,
        residenceAddress: personData.residenceAddress || personData.residence_address,
        residenceCity: personData.residenceCity || personData.residence_city,
        postalCode: personData.postalCode || personData.postal_code,
        province: personData.province,
        title: personData.title,
        hiredDate: personData.hiredDate || personData.hired_date,
        hourlyRate: personData.hourlyRate || personData.hourly_rate,
        iban: personData.iban,
        registerCode: personData.registerCode || personData.register_code,
        certifications: personData.certifications || [],
        specialties: personData.specialties || [],
        vatNumber: personData.vatNumber || personData.vat_number,
        username: personData.username,
        password: personData.password,
        globalRole: personData.globalRole,
        isActive: personData.isActive !== undefined ? personData.isActive : true
      };
      
      const person = await personService.createPerson(
        transformedData, 
        roleType || 'EMPLOYEE', 
        companyId, 
        tenantId
      );
      
      res.status(201).json(person);
    } catch (error) {
      logger.error('Error creating person:', { error: error.message, body: req.body });
      res.status(500).json({ error: error.message });
    }
  }
  
  // PUT /api/persons/:id
  async updatePerson(req, res) {
    try {
      const { id } = req.params;
      const { roleType, ...personData } = req.body;
      
      // Trasforma i campi da snake_case a camelCase se necessario
      const transformedData = {
        firstName: personData.firstName || personData.first_name,
        lastName: personData.lastName || personData.last_name,
        email: personData.email,
        phone: personData.phone,
        taxCode: personData.taxCode || personData.codice_fiscale,
        birthDate: personData.birthDate || personData.birth_date,
        residenceAddress: personData.residenceAddress || personData.residence_address,
        residenceCity: personData.residenceCity || personData.residence_city,
        postalCode: personData.postalCode || personData.postal_code,
        province: personData.province,
        title: personData.title,
        hiredDate: personData.hiredDate || personData.hired_date,
        hourlyRate: personData.hourlyRate || personData.hourly_rate,
        iban: personData.iban,
        registerCode: personData.registerCode || personData.register_code,
        certifications: personData.certifications,
        specialties: personData.specialties,
        vatNumber: personData.vatNumber || personData.vat_number,
        username: personData.username,
        globalRole: personData.globalRole,
        isActive: personData.isActive
      };
      
      // Rimuovi campi undefined
      Object.keys(transformedData).forEach(key => {
        if (transformedData[key] === undefined) {
          delete transformedData[key];
        }
      });
      
      const person = await personService.updatePerson(id, transformedData);
      
      res.json(person);
    } catch (error) {
      logger.error('Error updating person:', { error: error.message, id: req.params.id, body: req.body });
      res.status(500).json({ error: error.message });
    }
  }
  
  // DELETE /api/persons/:id
  async deletePerson(req, res) {
    try {
      const { id } = req.params;
      await personService.deletePerson(id);
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting person:', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }
  
  // POST /api/persons/:id/roles
  async addRole(req, res) {
    try {
      const { id } = req.params;
      const { roleType, companyId, tenantId } = req.body;
      
      const role = await personService.addRole(id, roleType, companyId, tenantId);
      res.status(201).json(role);
    } catch (error) {
      logger.error('Error adding role:', { error: error.message, id: req.params.id, body: req.body });
      res.status(500).json({ error: error.message });
    }
  }
  
  // DELETE /api/persons/:id/roles/:roleType
  async removeRole(req, res) {
    try {
      const { id, roleType } = req.params;
      const { companyId, tenantId } = req.query;
      
      await personService.removeRole(id, roleType, companyId, tenantId);
      res.status(204).send();
    } catch (error) {
      logger.error('Error removing role:', { error: error.message, id: req.params.id, roleType: req.params.roleType });
      res.status(500).json({ error: error.message });
    }
  }
}

export default new PersonController();