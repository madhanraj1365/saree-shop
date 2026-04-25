
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');

async function testConnections() {
  console.log("Testing Cloudinary...");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const result = await cloudinary.api.ping();
    console.log("Cloudinary connection: SUCCESS", result);
  } catch (err) {
    console.error("Cloudinary connection: FAILED", err);
  }

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
    
    // Test auth service
    await admin.auth().listUsers(1);
    console.log("Firebase Admin connection: SUCCESS");
  } catch (err) {
    console.error("Firebase Admin connection: FAILED", err.message);
  }
}

testConnections();
