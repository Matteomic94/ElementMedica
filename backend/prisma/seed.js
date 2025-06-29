const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger.js');
const prisma = new PrismaClient();

async function main() {
  // Companies
  const acme = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      industry: 'Manufacturing',
      status: 'Active',
      location: 'New York',
      employees_count: 120,
      established_year: 1995,
      contact_person: 'Jane Doe',
      phone: '555-1234',
      email: 'info@acme.com',
      address: '123 Main St',
      website: 'https://acme.com',
      description: 'A leading manufacturer.',
    }
  });

  // Employees
  await prisma.employee.create({
    data: {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@acme.com',
      phone: '555-5678',
      title: 'Engineer',
      status: 'Active',
      hired_date: new Date('2022-01-15'),
      companyId: acme.id,
    }
  });

  // Courses
  await prisma.course.create({
    data: {
      title: 'Workplace Safety',
      category: 'Safety',
      description: 'Safety training for all employees.',
      duration: '2',
      status: 'Active',
    }
  });

  // Trainers
  await prisma.trainer.create({
    data: {
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@trainers.com',
      phone: '555-8765',
      expertise: 'Safety',
      status: 'Active',
    }
  });
}

main()
  .catch(e => { 
  logger.error('Database seeding failed', {
    component: 'prisma-seed',
    action: 'seedDatabase',
    error: e.message,
    stack: e.stack
  });
  process.exit(1); 
})
  .finally(() => prisma.$disconnect());