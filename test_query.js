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

async function test() {
  const cursor = "2026-05-06T12:00:00.649Z";
  const collectionSlug = "raagam-korvai-sarees";
  const LISTING_FIELDS = ["_id", "slug", "name", "price", "images", "tags", "collection", "stock", "createdAt"];
  
  let q = db.collection("products")
    .where("collection", "==", collectionSlug)
    .select(...LISTING_FIELDS)
    .orderBy("createdAt", "desc")
    .limit(13);
    
  if (cursor) {
    const cursorDate = new Date(cursor);
    console.log("Cursor date:", cursorDate);
    q = q.startAfter(cursorDate);
  }
  
  try {
    const snapshot = await q.get();
    console.log("Success! Docs retrieved:", snapshot.docs.length);
  } catch (err) {
    console.error("Query failed:", err);
  }
}

test().catch(console.error);
