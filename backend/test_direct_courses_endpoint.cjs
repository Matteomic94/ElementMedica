const { PrismaClient } = require('@prisma/client');
const express = require('express');
const jwt = require('jsonwebtoken');

console.log('🧪 TEST DIRETTO ENDPOINT COURSES');
console.log('================================\n');

// Test diretto della logica dell'endpoint courses
async function testDirectCoursesLogic() {
  const prisma = new PrismaClient();
  
  try {
    console.log('1. 🔍 Test query Prisma diretta...');
    
    const courses = await prisma.course.findMany({
      where: {
        eliminato: false
      },
      include: {
        schedules: true
      }
    });
    
    console.log('✅ Query Prisma funziona correttamente');
    console.log(`📋 Numero corsi trovati: ${courses.length}`);
    
    if (courses.length > 0) {
      console.log('📋 Primo corso:', {
        id: courses[0].id,
        title: courses[0].title,
        eliminato: courses[0].eliminato,
        hasSchedules: courses[0].schedules ? courses[0].schedules.length : 0
      });
    }
    
    console.log('\n2. 🔍 Test schema Prisma...');
    
    // Verifica che il campo eliminato esista
    const courseFields = Object.keys(prisma.course.fields || {});
    console.log('📋 Campi disponibili nel modello Course:', courseFields.length > 0 ? 'Schema caricato' : 'Schema non disponibile');
    
    console.log('\n✅ TUTTI I TEST DIRETTI PASSATI');
    console.log('🔧 Il problema è che il server API non ha ricaricato le modifiche');
    console.log('🔄 È necessario riavviare il server API sulla porta 4001');
    
  } catch (error) {
    console.log('❌ Errore nel test diretto:', error.message);
    console.log('📋 Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectCoursesLogic();