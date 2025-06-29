const axios = require('axios');
const jwt = require('jsonwebtoken');

// Test per verificare se il fix di authService ha risolto il problema
async function testLoginVerifyFix() {
    console.log('🔍 TESTING LOGIN AND VERIFY AFTER AUTHSERVICE FIX');
    console.log('========================================');
    
    const baseURL = 'http://localhost:3000';
    const credentials = {
        identifier: 'mario.rossi@acme-corp.com',
        password: 'Password123!'
    };
    
    try {
        // Step 1: Login
        console.log('\n📝 Step 1: Testing login...');
        const loginResponse = await axios.post(`${baseURL}/api/v1/auth/login`, credentials, {
            timeout: 10000
        });
        
        console.log('✅ Login successful!');
        console.log(`📋 Status: ${loginResponse.status}`);
        
        const { accessToken } = loginResponse.data;
        console.log(`🎫 Access token received: ${accessToken.substring(0, 50)}...`);
        
        // Step 2: Decode token to check audience and issuer
        console.log('\n📝 Step 2: Analyzing token...');
        const decoded = jwt.decode(accessToken, { complete: true });
        console.log(`🔍 Token audience (aud): ${decoded.payload.aud}`);
        console.log(`🔍 Token issuer (iss): ${decoded.payload.iss}`);
        
        // Step 3: Test verify endpoint
        console.log('\n📝 Step 3: Testing verify endpoint...');
        const verifyResponse = await axios.get(`${baseURL}/api/v1/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            timeout: 10000
        });
        
        console.log('✅ Verify successful!');
        console.log(`📋 Status: ${verifyResponse.status}`);
        console.log(`👤 User ID: ${verifyResponse.data.user?.id}`);
        console.log(`📧 Email: ${verifyResponse.data.user?.email}`);
        
        console.log('\n🎉 SUCCESS: Login and verify are working correctly!');
        
    } catch (error) {
        console.log('\n❌ ERROR occurred:');
        if (error.code === 'ECONNABORTED') {
            console.log('🕐 Request timeout - verify endpoint still has issues');
        } else if (error.response) {
            console.log(`📋 Status: ${error.response.status}`);
            console.log(`💬 Message: ${error.response.data?.message || error.response.data?.error}`);
        } else {
            console.log(`💬 Error: ${error.message}`);
        }
    }
}

testLoginVerifyFix().catch(console.error);