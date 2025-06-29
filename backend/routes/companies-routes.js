import express from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import middleware from '../auth/middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

const { authenticate: authenticateToken, authorize: requirePermission, requireSameCompany: requireCompanyAccess } = middleware;

// Get all companies
router.get('/', authenticateToken(), requirePermission('read:companies'), async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(companies);
  } catch (error) {
    logger.error('Failed to fetch companies', {
      component: 'companies-routes',
      action: 'getCompanies',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch companies'
    });
  }
});

// Get company by ID
router.get('/:id', authenticateToken(), requirePermission('read:companies'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await prisma.company.findUnique({ 
      where: { id },
      include: {
        employees: true,
        _count: {
          select: {
            employees: true
          }
        }
      }
    });
    
    if (!company) {
      return res.status(404).json({ 
        error: 'Company not found',
        message: `Company with ID ${id} does not exist`
      });
    }
    
    res.json(company);
  } catch (error) {
    logger.error('Failed to fetch company', {
      component: 'companies-routes',
      action: 'getCompany',
      error: error.message,
      stack: error.stack,
      companyId: req.params?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch company'
    });
  }
});

// Create new company
router.post('/', authenticateToken(), requirePermission('create:companies'), async (req, res) => {
  try {
    // Remove 'name' field if present (legacy compatibility)
    const { name, ...data } = req.body;
    
    // Validate required fields
    if (!data.ragione_sociale) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'ragione_sociale is required'
      });
    }
    
    const company = await prisma.company.create({ 
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(201).json(company);
  } catch (error) {
    logger.error('Failed to create company', {
      component: 'companies-routes',
      action: 'createCompany',
      error: error.message,
      stack: error.stack,
      companyName: req.body?.nome
    });
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A company with this information already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create company'
    });
  }
});

// Update company
router.put('/:id', authenticateToken(), requirePermission('update:companies'), async (req, res) => {
  try {
    const { id } = req.params;
    // Remove 'name' field if present (legacy compatibility)
    const { name, ...data } = req.body;
    
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({ where: { id } });
    if (!existingCompany) {
      return res.status(404).json({ 
        error: 'Company not found',
        message: `Company with ID ${id} does not exist`
      });
    }
    
    const company = await prisma.company.update({ 
      where: { id }, 
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    
    res.json(company);
  } catch (error) {
    logger.error('Failed to update company', {
      component: 'companies-routes',
      action: 'updateCompany',
      error: error.message,
      stack: error.stack,
      companyId: req.params?.id
    });
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A company with this information already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update company'
    });
  }
});

// Soft delete company
router.delete('/:id', authenticateToken(), requirePermission('delete:companies'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({ 
      where: { id },
      include: {
        employees: true
      }
    });
    
    if (!existingCompany) {
      return res.status(404).json({ 
        error: 'Company not found',
        message: `Company with ID ${id} does not exist`
      });
    }
    
    // Check if company has employees
    if (existingCompany.employees.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete company',
        message: 'Company has associated employees. Please remove or reassign employees first.'
      });
    }
    
    // Perform soft delete by updating deletedAt field
    await prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(204).end();
  } catch (error) {
    logger.error('Failed to delete company', {
      component: 'companies-routes',
      action: 'deleteCompany',
      error: error.message,
      stack: error.stack,
      companyId: req.params?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete company'
    });
  }
});

export default router;