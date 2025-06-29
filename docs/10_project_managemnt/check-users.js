import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                email: true,
                is_active: true,
                created_at: true
            }
        });
        
        console.log('Users in database:');
        if (users.length === 0) {
            console.log('No users found in database');
        } else {
            users.forEach(user => {
                console.log(`- ID: ${user.id}, Email: ${user.email}, Active: ${user.is_active}, Created: ${user.created_at}`);
            });
        }
    } catch (error) {
        console.error('Error checking users:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();