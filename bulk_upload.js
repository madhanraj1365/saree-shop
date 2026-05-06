const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const admin = require('firebase-admin');

// Load environment variables from .env.local manually
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

// 1. Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, '\n');

// 2. Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}
const db = admin.firestore();

const BASE_DIR = path.join(__dirname, 'saree images');

const DESCRIPTION = `A graceful rose pink silk saree beautifully designed with traditional peacock zari motifs and a contrast navy border. Features a rich woven pallu and elegant finish, making it perfect for weddings and receptions. Color: Rose Pink Design: Peacock Zari Body type: Soft Silk Border: Contrast Navy Border Pallu: Rich Pallu Blouse: Running Blouse Material: Silk Occasion: Festive, Wedding Wear.`;

const DETAILS = [
  "KORVAI BORDER SILK COTTON SAREES",
  "Saree - 6:25 mts with Attached blouse",
  "korvai border With Contrast chit and line pallu",
  "Contrast plain blouse",
  "Direct manufacturing price- 570 -/- +Shipping",
  "All colors multiples Available",
  "Uniform Sarees Available."
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { folder: 'saree-shop' }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
}

async function run() {
  const folders = fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folderName of folders) {
    const folderPath = path.join(BASE_DIR, folderName);
    const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    
    // Assume the collection slug is the slugified folder name
    const collectionSlug = slugify(folderName);

    console.log(`\n===========================================`);
    console.log(`Processing collection: ${folderName} (${files.length} images)`);
    console.log(`===========================================`);

    let count = 1;
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      process.stdout.write(`  [${count}/${files.length}] Uploading ${file}... `);
      
      try {
        const imageUrl = await uploadImage(filePath);
        
        // Since image names are "IMG-...", we use a placeholder color 
        // e.g. "🩷Color 1 - Raagam Korvai Sarees"
        const productName = `🩷Color ${count} - ${folderName}`;
        const productSlug = slugify(productName) + '-' + crypto.randomUUID().slice(0, 6);
        const productId = `prd_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;

        const product = {
          _id: productId,
          slug: productSlug,
          name: productName,
          price: 599,
          description: DESCRIPTION,
          details: DETAILS,
          images: [imageUrl],
          tags: ["new-sale", "bridal", "wedding"],
          collection: collectionSlug,
          stock: 20,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection('products').doc(productId).set(product);
        console.log(`Done! -> Created: ${productName}`);
        count++;
      } catch (err) {
        console.log(`FAILED!`);
        console.error(`  -> Error processing ${file}:`, err.message || err);
      }
    }
  }
  console.log("\n✅ Bulk upload complete!");
  process.exit(0);
}

run().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
