#!/usr/bin/env node

/**
 * Example CLI authentication flow (similar to Vercel CLI)
 *
 * Usage: node cli-auth-example.js
 */

const http = require('http');
const https = require('https');

const API_BASE = 'http://localhost:3000';

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function authenticate() {
  console.log('🔐 Initiating authentication...\n');

  // Step 1: Request authentication
  const authRequest = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/cli-auth/request',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  console.log(`📝 Verification Code: ${authRequest.userCode}`);
  console.log(`\n🌐 Please visit: ${authRequest.verificationUrl}`);
  console.log('\nOr manually navigate to the URL and enter the verification code shown above.\n');
  console.log('⏳ Waiting for authentication...\n');

  // Step 2: Poll for authentication status
  let authenticated = false;
  let apiToken = null;

  while (!authenticated) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const status = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/cli-auth/poll/${authRequest.token}`,
      method: 'GET'
    });

    if (status.status === 'verified') {
      authenticated = true;
      apiToken = status.apiToken;
      console.log('✅ Authentication successful!\n');
      console.log(`🔑 API Token: ${apiToken}\n`);

      // Step 3: Test the API token
      console.log('📊 Testing authenticated request...\n');
      const profile = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/auth/profile',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      console.log('User Profile:', profile);
    } else if (status.status === 'expired') {
      console.log('❌ Authentication session expired. Please try again.');
      break;
    } else {
      process.stdout.write('.');
    }
  }
}

// Run the authentication flow
authenticate().catch(console.error);