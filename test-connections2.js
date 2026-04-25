
const admin = require('firebase-admin');

async function testConnections() {
  console.log("\nTesting Firebase Admin...");
  try {
    const serviceAccountKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!serviceAccountKey) throw new Error("No private key");
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: serviceAccountKey.replace(/\\n/g, '\n'),
      }),
    });
    
    // Test firestore
    const snapshot = await admin.firestore().collection('products').limit(1).get();
    console.log("Firebase Admin Firestore connection: SUCCESS, docs count:", snapshot.size);
  } catch (err) {
    console.error("Firebase Admin connection: FAILED", err);
  }
}

testConnections();
