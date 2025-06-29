const axios = require('axios');

async function testSistemaCompleto() {
  console.log('🧪 TEST SISTEMA COMPLETO');
  console.log('========================');
  
  let token = null;
  
  try {
    // Test 1: Login
    console.log('\n1. 🔐 Test Login...');
    const loginResponse = await axios.post('http://localhost:4001/api/v1/auth/login', {
      identifier: 'mario.rossi@acme-corp.com',
      password: 'Password123!'
    });
    
    if (loginResponse.status === 200 && loginResponse.data.data.accessToken) {
      token = loginResponse.data.data.accessToken;
      console.log('✅ Login riuscito - Token ottenuto');
    } else {
      console.log('❌ Login fallito - Nessun token');
      return;
    }
    
    // Test 2: Permissions endpoint
    console.log('\n2. 🔍 Test Endpoint Permissions...');
    try {
      const permissionsResponse = await axios.get('http://localhost:4001/api/v1/auth/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Permissions endpoint funziona:', permissionsResponse.status);
      console.log('📋 Roles:', permissionsResponse.data.roles);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Permissions endpoint non trovato (404) - Server non riavviato?');
      } else {
        console.log('❌ Errore permissions:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 3: Courses endpoint
    console.log('\n3. 📚 Test Endpoint Courses...');
    try {
      const coursesResponse = await axios.get('http://localhost:4001/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Courses endpoint funziona:', coursesResponse.status);
      console.log('📋 Numero corsi:', coursesResponse.data.length);
    } catch (error) {
      console.log('❌ Errore courses:', error.response?.status, error.response?.data?.error);
    }
    
    // Test 4: Companies endpoint
    console.log('\n4. 🏢 Test Endpoint Companies...');
    try {
      const companiesResponse = await axios.get('http://localhost:4001/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Companies endpoint funziona:', companiesResponse.status);
      console.log('📋 Numero aziende:', companiesResponse.data.length);
    } catch (error) {
      console.log('❌ Errore companies:', error.response?.status, error.response?.data?.error);
    }
    
    // Test 5: Schedules endpoint
    console.log('\n5. 📅 Test Endpoint Schedules...');
    try {
      const schedulesResponse = await axios.get('http://localhost:4001/api/schedules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Schedules endpoint funziona:', schedulesResponse.status);
      console.log('📋 Numero schedules:', schedulesResponse.data.length);
    } catch (error) {
      console.log('❌ Errore schedules:', error.response?.status, error.response?.data?.error);
    }
    
    // Test 6: Users endpoint
    console.log('\n6. 👥 Test Endpoint Users...');
    try {
      const usersResponse = await axios.get('http://localhost:4001/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Users endpoint funziona:', usersResponse.status);
      console.log('📋 Numero utenti:', usersResponse.data.length);
    } catch (error) {
      console.log('❌ Errore users:', error.response?.status, error.response?.data?.error);
    }
    
    console.log('\n🎯 RIEPILOGO TEST:');
    console.log('==================');
    console.log('✅ Login: Funziona');
    console.log('❓ Altri endpoint: Vedi risultati sopra');
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

testSistemaCompleto();