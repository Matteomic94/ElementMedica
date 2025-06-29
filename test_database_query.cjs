// Use the same optimized Prisma client as the backend
const { createOptimizedPrismaClient } = require('./backend/config/prisma-optimization.js');

let prisma;
try {
  prisma = createOptimizedPrismaClient();
  console.log('✅ Prisma client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma client:', error.message);
  process.exit(1);
}

async function testDatabaseQuery() {
  console.log('🔍 Testing database query that might be causing timeout...');
  
  try {
    // Test the exact query used in middleware
    console.log('\n📝 Step 1: Testing person query with includes...');
    const startTime = Date.now();
    
    const person = await prisma.person.findUnique({
      where: { id: 'person-admin-001' },
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
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Person query completed in ${queryTime}ms`);
    
    if (person) {
      console.log(`👤 Found person: ${person.email}`);
      console.log(`🔑 Roles count: ${person.personRoles?.length || 0}`);
      console.log(`🏢 Company: ${person.company?.name || 'N/A'}`);
      console.log(`🏠 Tenant: ${person.tenant?.name || 'N/A'}`);
    } else {
      console.log('❌ Person not found');
    }
    
    // Test separate queries (simplified approach)
    console.log('\n📝 Step 2: Testing simplified separate queries...');
    const startTime2 = Date.now();
    
    const personSimple = await prisma.person.findUnique({
      where: { id: 'person-admin-001' }
    });
    
    const personRoles = personSimple ? await prisma.personRole.findMany({
      where: { 
        personId: personSimple.id,
        isActive: true 
      },
      include: {
        company: true,
        tenant: true
      }
    }) : [];
    
    const company = personSimple?.companyId ? await prisma.company.findUnique({
      where: { id: personSimple.companyId }
    }) : null;
    
    const tenant = personSimple?.tenantId ? await prisma.tenant.findUnique({
      where: { id: personSimple.tenantId }
    }) : null;
    
    const queryTime2 = Date.now() - startTime2;
    console.log(`✅ Simplified queries completed in ${queryTime2}ms`);
    
    if (personSimple) {
      console.log(`👤 Found person: ${personSimple.email}`);
      console.log(`🔑 Roles count: ${personRoles.length}`);
      console.log(`🏢 Company: ${company?.name || 'N/A'}`);
      console.log(`🏠 Tenant: ${tenant?.name || 'N/A'}`);
    }
    
    // Test the $executeRaw query
    console.log('\n📝 Step 3: Testing $executeRaw query...');
    const startTime3 = Date.now();
    
    try {
      await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${'person-admin-001'}, true)`;
      const queryTime3 = Date.now() - startTime3;
      console.log(`✅ $executeRaw completed in ${queryTime3}ms`);
    } catch (rawError) {
      const queryTime3 = Date.now() - startTime3;
      console.error(`❌ $executeRaw failed after ${queryTime3}ms:`, rawError.message);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('📊 Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseQuery();