const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

const prisma = new PrismaClient();

describe('Authentication Tests', () => {
  let testCompany;
  let testUser;

  beforeEach(async () => {
    // Create test company first
    testCompany = await prisma.company.create({
      data: {
        ragione_sociale: 'Test Company',
        mail: 'test@company.com',
        telefono: '1234567890',
        sede_azienda: 'Test Address',
        citta: 'Test City',
        provincia: 'Test Province',
        cap: '12345',
        piva: '12345678901',
        codice_fiscale: 'TSTCMP12345678',
        is_active: true
      }
    });

    // Create test user
    const hashedPassword = await bcryptjs.hash('Admin123!', 12);
    testUser = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        companyId: testCompany.id
      }
    });
  });

  afterEach(async () => {
    // Clean up test data in correct order
    try {
      await prisma.employee.deleteMany({ where: { email: 'admin@example.com' } });
      await prisma.user.deleteMany({ where: { email: 'admin@example.com' } });
      await prisma.company.deleteMany({ where: { ragione_sociale: 'Test Company' } });
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  });

  describe('Password Validation', () => {
    it('should hash password correctly', async () => {
      const password = 'Admin123!';
      const hashedPassword = await bcryptjs.hash(password, 12);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should validate correct password', async () => {
      const password = 'Admin123!';
      const hashedPassword = await bcryptjs.hash(password, 12);
      const isValid = await bcryptjs.compare(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Admin123!';
      const wrongPassword = 'WrongPassword';
      const hashedPassword = await bcryptjs.hash(password, 12);
      const isValid = await bcryptjs.compare(wrongPassword, hashedPassword);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Operations', () => {
    it('should generate JWT token', () => {
      const payload = { userId: 1, email: 'admin@example.com', role: 'admin' };
      const secret = process.env.JWT_SECRET || 'test-secret';
      
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should verify valid JWT token', () => {
      const payload = { userId: 1, email: 'admin@example.com', role: 'admin' };
      const secret = process.env.JWT_SECRET || 'test-secret';
      
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe('Database Operations', () => {
    it('should create and retrieve user', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      
      expect(user).toBeDefined();
      expect(user.email).toBe('admin@example.com');
      expect(user.firstName).toBe('Admin');
      expect(user.lastName).toBe('User');
    });

    it('should verify user password hash', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      
      const isValid = await bcryptjs.compare('Admin123!', user.password);
      expect(isValid).toBe(true);
    });
  });
});