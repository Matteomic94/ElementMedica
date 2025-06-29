#!/usr/bin/env node

/**
 * Test script per verificare l'endpoint /verify con token reale
 * Ottiene token dal login e testa verify
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4001';
const CREDENTIALS = {
  identifier: 'mario.rossi@acme-corp.com',
  password: 'Password123!'
};

async function testLoginAndVerify() {
  console.log('🔐 Testing login and verify with real token...');
  
  try {
    // Step 1: Login to get real token
    console.log('\n1. 🚀 Attempting login...');
    const loginResponse = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(CREDENTIALS)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('📋 Response structure:', {
      success: loginData.success,
      message: loginData.message,
      hasData: !!loginData.data,
      hasAccessToken: !!loginData.data?.accessToken
    });
    
    const accessToken = loginData.data?.accessToken;
    if (!accessToken) {
      throw new Error('No access token in login response');
    }
    
    console.log('🔑 Token obtained:', {
      length: accessToken.length,
      starts: accessToken.substring(0, 20) + '...',
      ends: '...' + accessToken.substring(accessToken.length - 20)
    });
    
    // Step 2: Test verify endpoint with real token
    console.log('\n2. 🔍 Testing verify endpoint...');
    const verifyResponse = await fetch(`${API_BASE}/api/v1/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('📊 Verify response status:', verifyResponse.status);
    console.log('📊 Verify response headers:', Object.fromEntries(verifyResponse.headers));
    
    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      throw new Error(`Verify failed: ${verifyResponse.status} ${verifyResponse.statusText}\nBody: ${errorText}`);
    }
    
    const verifyData = await verifyResponse.json();
    console.log('✅ Verify successful!');
    console.log('📋 Verify response:', {
      valid: verifyData.valid,
      hasUser: !!verifyData.user,
      userId: verifyData.user?.id,
      userEmail: verifyData.user?.email,
      permissionsCount: verifyData.permissions?.length || 0
    });
    
    console.log('\n🎉 SUCCESS: Both login and verify working correctly!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.code === 'ECONNABORTED') {
      console.error('🕐 Request timed out - server may be unresponsive');
    }
    process.exit(1);
  }
}

// Add timeout handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
testLoginAndVerify();