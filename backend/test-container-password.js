const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const person = await prisma.person.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (person) {
      const isValid = await bcrypt.compare('Admin123!', person.password);
      console.log('Password verification in container:', isValid);
      console.log('Password hash:', person.password);
      console.log('Person ID:', person.id);
    } else {
      console.log('Person not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();