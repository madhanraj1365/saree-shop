const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });
let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
privateKey = privateKey.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }) });
const db = admin.firestore();

async function testPagination() {
  let cursor = null;
  let total = 0;
  let hasMore = true;
  
  while (hasMore) {
    let q = db.collection('products')
      .where('collection', '==', 'raagam-korvai-sarees')
      .orderBy('createdAt', 'desc')
      .limit(13); // 12 + 1
      
    if (cursor) {
      q = q.startAfter(cursor);
    }
    
    const snapshot = await q.get();
    const docs = snapshot.docs;
    
    if (docs.length > 12) {
      hasMore = true;
      cursor = docs[11].data().createdAt;
      total += 12;
      console.log(`Loaded 12, next cursor: ${cursor.toDate()}`);
    } else {
      hasMore = false;
      total += docs.length;
      console.log(`Loaded final ${docs.length}`);
    }
  }
  
  console.log(`Total retrieved via pagination: ${total}`);
}

testPagination().catch(console.error);
