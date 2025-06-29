/**
 * Test minimale per identificare la causa della duplicazione JSON
 * Bypassa tutti i middleware possibili
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 4099; // Porta diversa per evitare conflitti

// Solo middleware essenziali
app.use(cors());
app.use(bodyParser.json());

// Route di test minimale
app.post('/test/login', (req, res) => {
  console.log('📥 Request received:', req.body);
  
  const response = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    user: {
      id: 'test-user-001',
      email: 'test@example.com',
      name: 'Test User'
    }
  };
  
  console.log('📤 Sending response:', response);
  res.json(response);
});

// Avvia server di test
const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  
  // Test automatico
  setTimeout(async () => {
    try {
      const axios = require('axios');
      
      console.log('\n🧪 Testing minimal login...');
      const response = await axios.post(`http://localhost:${PORT}/test/login`, {
        identifier: 'test@example.com',
        password: 'test123'
      });
      
      console.log('✅ Response received:');
      console.log('Status:', response.status);
      
      const responseText = JSON.stringify(response.data, null, 2);
      console.log('Response body:');
      console.log(responseText);
      
      // Check for duplication
      const responseStr = JSON.stringify(response.data);
      const accessTokenMatches = (responseStr.match(/"accessToken"/g) || []).length;
      const userMatches = (responseStr.match(/"user"/g) || []).length;
      
      console.log('\n🔍 Duplication check:');
      console.log(`- accessToken appears: ${accessTokenMatches} times`);
      console.log(`- user appears: ${userMatches} times`);
      
      if (accessTokenMatches > 1 || userMatches > 1) {
        console.log('❌ DUPLICATION DETECTED IN MINIMAL SERVER!');
      } else {
        console.log('✅ No duplication in minimal server');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    } finally {
      server.close();
      process.exit(0);
    }
  }, 1000);
});