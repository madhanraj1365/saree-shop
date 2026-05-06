const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function checkDates() {
  const snapshot = await db.collection("products")
    .where("collection", "==", "raagam-korvai-sarees")
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
    
  snapshot.docs.forEach((doc, i) => {
    console.log(`${i+1}: ${doc.data().name} - ${doc.data().createdAt.toDate().toISOString()}`);
  });
}

checkDates().catch(console.error);
