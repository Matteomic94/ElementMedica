#!/usr/bin/env node

/**
 * Test per debug routing proxy-server
 * Testa direttamente il proxy-server per verificare il routing
 */

const axios = require('axios');

const PROXY_URL = 'http://localhost:4003';
const API_URL = 'http://localhost:4001';

async function testProxyRouting() {
  console.log('🔍 TEST PROXY ROUTING DEBUG');
  console.log('=' .repeat(50));
  
  // Test 1: Diretto al proxy-server con path /v1/auth/login (come arriva da Vite)
  console.log('\n1. Test diretto proxy-server /v1/auth/login (simulazione Vite)');
  try {
    const response = await axios.post(`${PROXY_URL}/v1/auth/login`, {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Headers:', response.headers['content-type']);
    console.log('✅ Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status || 'NO_RESPONSE');
    console.log('❌ Error data:', error.response?.data || error.message);
    console.log('❌ Error headers:', error.response?.headers || 'NO_HEADERS');
  }
  
  // Test 2: Diretto al proxy-server con path /api/auth/login
  console.log('\n2. Test diretto proxy-server /api/auth/login');
  try {
    const response = await axios.post(`${PROXY_URL}/api/auth/login`, {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Headers:', response.headers['content-type']);
    console.log('✅ Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status || 'NO_RESPONSE');
    console.log('❌ Error data:', error.response?.data || error.message);
  }
  
  // Test 3: Diretto all'API server per conferma
  console.log('\n3. Test diretto API server /api/v1/auth/login');
  try {
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
      identifier: 'admin@example.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Headers:', response.headers['content-type']);
    console.log('✅ Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status || 'NO_RESPONSE');
    console.log('❌ Error data:', error.response?.data || error.message);
  }
  
  // Test 4: Health check proxy
  console.log('\n4. Test health check proxy-server');
  try {
    const response = await axios.get(`${PROXY_URL}/health`);
    console.log('✅ Proxy health:', response.status, response.data);
  } catch (error) {
    console.log('❌ Proxy health error:', error.message);
  }
  
  // Test 5: Health check API
  console.log('\n5. Test health check API server');
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ API health:', response.status, response.data);
  } catch (error) {
    console.log('❌ API health error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🔍 TEST COMPLETATO');
}

// Esegui test
testProxyRouting().catch(console.error);