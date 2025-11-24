// Simple manual test script for /messages/upload endpoint
// Usage: node scripts/test-upload.js <JWT_ACCESS_TOKEN> <RECEIVER_USER_ID>
// Requires Node >=18 (global fetch & FormData)

import fs from 'fs';
import path from 'path';
import process from 'process';

const [,, token, receiverId] = process.argv;
if (!token || !receiverId) {
  console.error('Usage: node scripts/test-upload.js <JWT_ACCESS_TOKEN> <RECEIVER_USER_ID>');
  process.exit(1);
}

// Create a temp file to upload
const tempFilePath = path.join(process.cwd(), 'sample-upload.txt');
fs.writeFileSync(tempFilePath, 'Sample file content for upload test at ' + new Date().toISOString());

try {
  const buffer = fs.readFileSync(tempFilePath);
  const blob = new Blob([buffer], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'sample-upload.txt');
  formData.append('receiverId', receiverId);

  const res = await fetch('http://localhost:8000/api/v1/messages/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(json, null, 2));
} catch (e) {
  console.error('Upload failed:', e);
} finally {
  fs.unlinkSync(tempFilePath);
}
