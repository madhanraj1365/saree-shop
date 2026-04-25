import "server-only";

import crypto from "node:crypto";
import {
  Timestamp,
  FieldValue,
} from "firebase-admin/firestore";
import { collections as seedCollections, products as seedProducts, reviews as seedReviews } from "@/data/catalog";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

function isFirestoreUnavailableError(error) {
  const message = String(error?.message || "");
  return (
    message.includes("firestore.googleapis.com") ||
    message.includes("Cloud Firestore API has not been used") ||
    message.includes("PERMISSION_DENIED")
  );
}

function getFirestoreSetupError() {
  return new Error(
    "Cloud Firestore is not enabled for this Firebase project yet. In Firebase Console, create/enable Firestore Database first, then try again."
  );
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUniqueSlug(baseValue, existingSlugs) {
  const baseSlug = slugify(baseValue) || `item-${crypto.randomUUID().slice(0, 8)}`;

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let index = 2;
  while (existingSlugs.has(`${baseSlug}-${index}`)) {
    index += 1;
  }

  return `${baseSlug}-${index}`;
}

function toList(value) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toIsoDate(value) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  return new Date(value).toISOString();
}

function normalizeCollection(record) {
  return {
    slug: record.slug,
    name: record.name,
    description: record.description,
    image: record.image,
    createdAt: toIsoDate(record.createdAt),
  };
}

function normalizeProduct(record) {
  return {
    _id: record._id,
    slug: record.slug,
    name: record.name,
    price: Number(record.price),
    description: record.description,
    details: Array.isArray(record.details) ? record.details : [],
    images: Array.isArray(record.images) ? record.images : [],
    tags: Array.isArray(record.tags) ? record.tags : [],
    collection: record.collection,
    stock: Number(record.stock ?? 0),
    createdAt: toIsoDate(record.createdAt),
  };
}

function mergeBySlug(seedItems, remoteItems) {
  const bySlug = new Map(seedItems.map((item) => [item.slug, item]));

  for (const item of remoteItems) {
    bySlug.set(item.slug, item);
  }

  return [...bySlug.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

async function listCollectionDocuments(collectionName, normalizer) {
  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db.collection(collectionName).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((document) => normalizer(document.data()));
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getCollections() {
  const remoteCollections = await listCollectionDocuments("collections", normalizeCollection);
  const seeded = seedCollections.map((collectionItem) => normalizeCollection(collectionItem));
  return mergeBySlug(seeded, remoteCollections);
}

export async function getProducts() {
  const remoteProducts = await listCollectionDocuments("products", normalizeProduct);
  const seeded = seedProducts.map((productItem) => normalizeProduct(productItem));
  return mergeBySlug(seeded, remoteProducts);
}

export async function getReviews() {
  return seedReviews;
}

export async function getCollectionBySlug(slug) {
  const collections = await getCollections();
  return collections.find((collectionItem) => collectionItem.slug === slug);
}

export async function getProductBySlug(slug) {
  const products = await getProducts();
  return products.find((product) => product.slug === slug);
}

export async function getProductsByCollection(collectionSlug) {
  const products = await getProducts();

  if (!collectionSlug) {
    return products;
  }

  return products.filter((product) => product.collection === collectionSlug);
}

export async function getProductsByTag(tag) {
  const products = await getProducts();

  if (!tag) {
    return products;
  }

  return products.filter((product) => product.tags.includes(tag));
}

export async function getNewSaleProducts(limit = 4) {
  const products = await getProducts();
  return [...products]
    .filter((product) => product.tags.includes("new-sale"))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product) {
    return [];
  }

  const products = await getProducts();
  return products
    .filter((candidate) => {
      return (
        candidate.slug !== product.slug &&
        (candidate.collection === product.collection ||
          candidate.tags.some((tag) => product.tags.includes(tag)))
      );
    })
    .slice(0, limit);
}

export async function addCollection(input) {
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const image = String(input.image || "").trim();

  if (!name || !description) {
    throw new Error("Collection name and description are required.");
  }

  const existingCollections = await getCollections();
  const slug = createUniqueSlug(name, new Set(existingCollections.map((collectionItem) => collectionItem.slug)));
  const payload = {
    slug,
    name,
    description,
    image,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await getFirebaseAdminDb().collection("collections").doc(slug).set(payload);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      throw getFirestoreSetupError();
    }

    throw error;
  }

  return {
    ...payload,
    createdAt: new Date().toISOString(),
  };
}

export async function updateCollection(slug, input) {
  const existingCollections = await getCollections();
  const collection = existingCollections.find((item) => item.slug === slug);

  if (!collection) {
    throw new Error("Collection not found.");
  }

  const name = String(input.name ?? collection.name).trim();
  const description = String(input.description ?? collection.description).trim();
  const image = String(input.image ?? collection.image ?? "").trim();

  if (!name || !description) {
    throw new Error("Collection name and description are required.");
  }

  const payload = {
    ...collection,
    name,
    description,
    image,
  };

  try {
    await getFirebaseAdminDb().collection("collections").doc(slug).set(payload, { merge: true });
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      throw getFirestoreSetupError();
    }

    throw error;
  }

  return payload;
}

export async function addProduct(input) {
  const name = String(input.name || "").trim();
  const description = String(input.description || "").trim();
  const collectionSlug = String(input.collection || "").trim();
  const imageList = toList(String(input.images || ""));
  const detailList = toList(String(input.details || ""));
  const tagList = toList(String(input.tags || ""));
  const price = Number(input.price);
  const stock = Number.parseInt(String(input.stock), 10);

  if (!name || !description || !collectionSlug || !imageList.length) {
    throw new Error("Name, description, collection, and at least one image URL are required.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Price must be a valid number greater than zero.");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Stock must be a whole number that is zero or more.");
  }

  const existingCollections = await getCollections();
  const collectionExists = existingCollections.some((item) => item.slug === collectionSlug);

  if (!collectionExists) {
    throw new Error("Select a valid collection before adding a saree.");
  }

  const existingProducts = await getProducts();
  const slug = createUniqueSlug(name, new Set(existingProducts.map((product) => product.slug)));
  const payload = {
    _id: `prd_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
    slug,
    name,
    price,
    description,
    details: detailList.length ? detailList : ["Premium saree", "Ready to order"],
    images: imageList,
    tags: tagList.length ? tagList : ["new-sale"],
    collection: collectionSlug,
    stock,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    await getFirebaseAdminDb().collection("products").doc(payload._id).set(payload);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      throw getFirestoreSetupError();
    }

    throw error;
  }

  return {
    ...payload,
    createdAt: new Date().toISOString(),
  };
}

export async function updateProduct(slug, input) {
  const existingProducts = await getProducts();
  const product = existingProducts.find((p) => p.slug === slug);
  
  if (!product) {
    throw new Error("Product not found");
  }

  const updates = {};
  if (input.name) updates.name = String(input.name).trim();
  if (input.description) updates.description = String(input.description).trim();
  if (input.collection) updates.collection = String(input.collection).trim();
  
  if (input.images) {
    const imageList = toList(String(input.images));
    if (imageList.length) updates.images = imageList;
  }
  
  if (input.details) {
    updates.details = toList(String(input.details));
  }
  
  if (input.tags) {
    updates.tags = toList(String(input.tags));
  }
  
  if (input.price !== undefined) {
    const price = Number(input.price);
    if (Number.isFinite(price) && price > 0) updates.price = price;
  }
  
  if (input.stock !== undefined) {
    const stock = Number.parseInt(String(input.stock), 10);
    if (Number.isInteger(stock) && stock >= 0) updates.stock = stock;
  }

  try {
    const finalProduct = { ...product, ...updates };
    // We use set with merge: true so that if the product only exists in local seed data,
    // it will be properly created in Firestore.
    await getFirebaseAdminDb().collection("products").doc(product._id).set(finalProduct, { merge: true });
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      throw getFirestoreSetupError();
    }
    throw error;
  }

  return { ...product, ...updates };
}

export async function deleteProduct(slug) {
  const existingProducts = await getProducts();
  const product = existingProducts.find((p) => p.slug === slug);
  
  if (!product) {
    throw new Error("Product not found");
  }

  try {
    await getFirebaseAdminDb().collection("products").doc(product._id).delete();
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      throw getFirestoreSetupError();
    }
    throw error;
  }
  
  return { success: true };
}
