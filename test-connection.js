import axios from 'axios';

async function testConnection() {
  try {
    console.log('Testing server connection...');
    
    // Test basic connection
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Server health check:', healthResponse.status);
    
  } catch (error) {
    console.error('❌ Connection error:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
  }
}

// Test authentication status
async function testAuth() {
  try {
    console.log('\nTesting auth status...');
    
    const authResponse = await axios.get('http://localhost:3000/api/auth/me', {
      validateStatus: function (status) {
        return status < 500; // Accept 4xx errors as valid responses
      }
    });
    
    console.log('Auth response status:', authResponse.status);
    console.log('Auth response data:', authResponse.data);
    
  } catch (error) {
    console.error('❌ Auth test error:', error.message);
  }
}

// Run tests
testConnection()
  .then(() => testAuth())
  .catch(console.error);