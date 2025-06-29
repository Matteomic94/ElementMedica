import { JWTService } from './auth/jwt.js';
import optimizedPrisma from './config/database.js';

const prisma = optimizedPrisma.getClient();

async function testJWTVerify() {
    try {
        console.log('🔍 Testing JWT verification...');
        
        // First, let's create a test token
        const testPayload = {
            userId: 'person-admin-001',
            personId: 'person-admin-001',
            email: 'mario.rossi@acme-corp.com',
            username: 'mario.rossi'
        };
        
        console.log('📝 Generating test token...');
        const testToken = JWTService.generateAccessToken(testPayload);
        console.log('✅ Token generated:', testToken.substring(0, 50) + '...');
        
        console.log('🔍 Verifying token...');
        const startTime = Date.now();
        const decoded = JWTService.verifyAccessToken(testToken);
        const endTime = Date.now();
        
        console.log('✅ Token verified successfully in', endTime - startTime, 'ms');
        console.log('📄 Decoded payload:', decoded);
        
        // Test database connection
        console.log('🔍 Testing database connection...');
        console.log('🔍 Prisma client type:', typeof prisma);
        console.log('🔍 Prisma client methods:', Object.getOwnPropertyNames(prisma));
        
        if (!prisma) {
            throw new Error('Prisma client is undefined');
        }
        
        // Simple database test
        const dbStartTime = Date.now();
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        const dbEndTime = Date.now();
        
        console.log('✅ Database raw query completed in', dbEndTime - dbStartTime, 'ms');
        console.log('📊 Raw query result:', result);
        
        // Test Person table access (bypassing middleware)
        console.log('🔍 Testing Person table access...');
        const personStartTime = Date.now();
        const personResult = await prisma.$queryRaw`
            SELECT id, email, username, "isActive", "isDeleted" 
            FROM persons 
            WHERE email = 'mario.rossi@acme-corp.com' 
            AND "isDeleted" = false
        `;
        const personEndTime = Date.now();
        
        console.log('✅ Person query completed in', personEndTime - personStartTime, 'ms');
        console.log('👤 Person found:', personResult.length > 0 ? 'Yes' : 'No');
        console.log('📊 Person result:', personResult);
        
        // Test Prisma model access (con middleware)
        console.log('🔍 Testing Prisma model access...');
        try {
            const modelStartTime = Date.now();
            const personModel = await prisma.person.findFirst({
                where: { 
                    email: 'mario.rossi@acme-corp.com'
                }
            });
            const modelEndTime = Date.now();
            console.log('✅ Prisma model query completed in', modelEndTime - modelStartTime, 'ms');
            console.log('👤 Person model found:', personModel ? 'Yes' : 'No');
        } catch (modelError) {
            console.log('❌ Prisma model error:', modelError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Stack trace:', error.stack);
    } finally {
        await optimizedPrisma.disconnect();
    }
}

testJWTVerify();