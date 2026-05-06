const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...val] = line.split('=');
      process.env[key.trim()] = val.join('=').trim();
    }
  });
} catch (e) {
  console.log("Could not load .env.local");
}

let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
privateKey = privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }) });
const db = admin.firestore();

async function count() {
  const snapshot = await db.collection('products').get();
  const counts = {};
  snapshot.docs.forEach(doc => {
    const col = doc.data().collection;
    counts[col] = (counts[col] || 0) + 1;
  });
  console.log("Database counts:", counts);
}
count().catch(console.error);
