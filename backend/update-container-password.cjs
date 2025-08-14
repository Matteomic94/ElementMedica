const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    await prisma.person.update({
      where: { email: 'admin@example.com' },
      data: { password: hashedPassword }
    });
    
    console.log('Password updated successfully in container');
    console.log('New hash:', hashedPassword);
    
    // Verify the update
    const person = await prisma.person.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    const isValid = await bcrypt.compare('Admin123!', person.password);
    console.log('Verification after update:', isValid);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();