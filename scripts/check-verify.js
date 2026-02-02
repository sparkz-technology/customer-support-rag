#!/usr/bin/env node
// Simple script to POST to /auth/verify-otp via the dev client server and print the response
// Usage: node scripts/check-verify.js [email] [otp] [devServerUrl]

const email = process.argv[2] || 'admin@example.com';
const otp = process.argv[3] || '123456';
const devServer = process.argv[4] || 'http://localhost:5174';
const url = `${devServer.replace(/\/$/, '')}/api/auth/verify-otp`;

async function run() {
  try {
    console.log(`POST ${url} with email=${email} otp=${otp}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    console.log('HTTP', res.status, res.statusText);
    console.log('Response:');
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    if (res.ok) process.exit(0);
    process.exit(1);
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(2);
  }
}

run();
