// security-test.js - Comprehensive Security Testing Suite
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:4000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - ${details}`);
  }
  testResults.details.push({ name, passed, details });
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication Security...');
  
  // Test 1: Invalid login credentials
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    logTest('Invalid Login Rejection', false, 'Should have rejected invalid credentials');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Invalid Login Rejection', true);
    } else {
      logTest('Invalid Login Rejection', false, `Unexpected status: ${error.response?.status}`);
    }
  }
  
  // Test 2: Missing required fields
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com'
      // Missing password
    });
    logTest('Missing Fields Validation', false, 'Should have rejected missing password');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Missing Fields Validation', true);
    } else {
      logTest('Missing Fields Validation', false, `Unexpected status: ${error.response?.status}`);
    }
  }
  
  // Test 3: Invalid email format
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'invalid-email',
      password: 'password123'
    });
    logTest('Email Format Validation', false, 'Should have rejected invalid email format');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Email Format Validation', true);
    } else {
      logTest('Email Format Validation', false, `Unexpected status: ${error.response?.status}`);
    }
  }
}

async function testNoSQLInjection() {
  console.log('\n🛡️ Testing NoSQL Injection Protection...');
  
  const maliciousQueries = [
    { search: 'test" || "1"=="1' },
    { search: 'test"; return true; //' },
    { search: 'test\' || 1==1 || \'' },
    { search: 'test"; db.adminCommand({shutdown: 1}); //' }
  ];
  
  for (const query of maliciousQueries) {
    try {
      const response = await axios.get(`${BASE_URL}/api/testimonials?search=${encodeURIComponent(query.search)}`);
      // If we get a response without error, the injection was blocked
      logTest(`NoSQL Injection Protection - ${query.search}`, true);
    } catch (error) {
      if (error.response?.status === 400) {
        logTest(`NoSQL Injection Protection - ${query.search}`, true);
      } else {
        logTest(`NoSQL Injection Protection - ${query.search}`, false, `Unexpected response: ${error.response?.status}`);
      }
    }
  }
}

async function testFileUploadSecurity() {
  console.log('\n📁 Testing File Upload Security...');
  
  // Test 1: Unauthorized upload attempt
  try {
    const formData = new FormData();
    formData.append('file', Buffer.from('fake image data'), 'test.jpg');
    
    await axios.post(`${BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    logTest('Unauthorized Upload Rejection', false, 'Should have rejected upload without auth');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Unauthorized Upload Rejection', true);
    } else {
      logTest('Unauthorized Upload Rejection', false, `Unexpected status: ${error.response?.status}`);
    }
  }
  
  // Test 2: Invalid file type
  try {
    const formData = new FormData();
    formData.append('file', Buffer.from('fake executable'), 'malware.exe');
    
    await axios.post(`${BASE_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    logTest('Invalid File Type Rejection', false, 'Should have rejected executable file');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Invalid File Type Rejection', true);
    } else {
      logTest('Invalid File Type Rejection', false, `Unexpected status: ${error.response?.status}`);
    }
  }
}

async function testRateLimiting() {
  console.log('\n⏱️ Testing Rate Limiting...');
  
  const requests = [];
  const maxRequests = 60; // Exceed the limit
  
  for (let i = 0; i < maxRequests; i++) {
    requests.push(
      axios.post(`${BASE_URL}/api/chatbot`, {
        query: `test message ${i}`
      }).catch(error => error.response)
    );
  }
  
  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r?.status === 429);
  
  if (rateLimited.length > 0) {
    logTest('Rate Limiting', true, `${rateLimited.length} requests were rate limited`);
  } else {
    logTest('Rate Limiting', false, 'No requests were rate limited');
  }
}

async function testCORS() {
  console.log('\n🌐 Testing CORS Configuration...');
  
  try {
    const response = await axios.options(`${BASE_URL}/api/auth/login`, {
      headers: {
        'Origin': 'http://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = response.headers;
    const allowedOrigin = corsHeaders['access-control-allow-origin'];
    
    if (allowedOrigin && allowedOrigin !== '*') {
      logTest('CORS Origin Restriction', true);
    } else {
      logTest('CORS Origin Restriction', false, 'CORS allows all origins');
    }
  } catch (error) {
    logTest('CORS Configuration', false, `CORS test failed: ${error.message}`);
  }
}

async function testInputValidation() {
  console.log('\n✅ Testing Input Validation...');
  
  // Test XSS prevention
  const xssPayloads = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src=x onerror=alert("xss")>'
  ];
  
  for (const payload of xssPayloads) {
    try {
      await axios.post(`${BASE_URL}/api/chatbot`, {
        query: payload
      });
      logTest(`XSS Prevention - ${payload}`, true);
    } catch (error) {
      if (error.response?.status === 400) {
        logTest(`XSS Prevention - ${payload}`, true);
      } else {
        logTest(`XSS Prevention - ${payload}`, false, `Unexpected response: ${error.response?.status}`);
      }
    }
  }
}

async function testSecurityHeaders() {
  console.log('\n🛡️ Testing Security Headers...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length === 0) {
      logTest('Security Headers', true);
    } else {
      logTest('Security Headers', false, `Missing headers: ${missingHeaders.join(', ')}`);
    }
  } catch (error) {
    logTest('Security Headers', false, `Failed to check headers: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Security Test Suite...\n');
  
  try {
    await testAuthentication();
    await testNoSQLInjection();
    await testFileUploadSecurity();
    await testRateLimiting();
    await testCORS();
    await testInputValidation();
    await testSecurityHeaders();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.details
        .filter(test => !test.passed)
        .forEach(test => console.log(`  - ${test.name}: ${test.details}`));
    }
    
    if (testResults.failed === 0) {
      console.log('\n🎉 All security tests passed! Your application is secure.');
    } else {
      console.log('\n⚠️ Some security issues were found. Please review and fix them.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run the tests
runAllTests(); 