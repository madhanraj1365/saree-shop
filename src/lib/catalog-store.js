import "server-only";

import crypto from "node:crypto";
import {
  Timestamp,
  FieldValue,
  FieldPath,
} from "firebase-admin/firestore";
import { collections as seedCollections, products as seedProducts, reviews as seedReviews } from "@/data/catalog";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

// ─── Listing fields ────────────────────────────────────────────────────
// Only fetch the fields needed for ProductCard display.
// This reduces data transfer per document significantly.
const LISTING_FIELDS = ["_id", "slug", "name", "price", "images", "tags", "collection", "stock", "createdAt"];

// ─── Helpers ───────────────────────────────────────────────────────────

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

/**
 * Lightweight normalizer for listing pages (no description/details).
 * Only keeps the FIRST image as a thumbnail — not the full array.
 * Used with select() queries that only fetch LISTING_FIELDS.
 */
function normalizeProductLite(record) {
  const allImages = Array.isArray(record.images) ? record.images : [];
  return {
    _id: record._id,
    slug: record.slug,
    name: record.name,
    price: Number(record.price),
    image: allImages[0] || "",
    images: [allImages[0] || ""].filter(Boolean),
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

// ─── Core Firestore helpers (with cache) ──────────────────────────────

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

// ─── Collections ──────────────────────────────────────────────────────

export async function getCollections() {
  const remoteCollections = await listCollectionDocuments("collections", normalizeCollection);
  const seeded = seedCollections.map((collectionItem) => normalizeCollection(collectionItem));
  return mergeBySlug(seeded, remoteCollections);
}

// ─── Full products (used ONLY by admin pages) ─────────────────────────

export async function getProducts() {
  const remoteProducts = await listCollectionDocuments("products", normalizeProduct);
  const seeded = seedProducts.map((productItem) => normalizeProduct(productItem));
  return mergeBySlug(seeded, remoteProducts);
}

// ─── Reviews (local seed data only) ───────────────────────────────────

export async function getReviews() {
  return seedReviews;
}

// ─── Targeted queries (minimal reads) ─────────────────────────────────

/**
 * Get a single collection by its slug — 1 Firestore read max.
 * Falls back to seed data if not found in Firestore.
 */
export async function getCollectionBySlug(slug) {
  if (!slug) return undefined;

  // Check seed data first (0 reads)
  const seeded = seedCollections.find((c) => c.slug === slug);

  try {
    const db = getFirebaseAdminDb();
    const doc = await db.collection("collections").doc(slug).get();
    if (doc.exists) {
      return normalizeCollection(doc.data());
    }
  } catch (error) {
    if (!isFirestoreUnavailableError(error)) throw error;
  }

  return seeded ? normalizeCollection(seeded) : undefined;
}

/**
 * Get a single product by slug — queries with where() for 1 doc.
 * Falls back to seed data.
 */
export async function getProductBySlug(slug) {
  if (!slug) return undefined;

  // Check seed data first (0 reads)
  const seeded = seedProducts.find((p) => p.slug === slug);

  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db
      .collection("products")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return normalizeProduct(snapshot.docs[0].data());
    }
  } catch (error) {
    if (!isFirestoreUnavailableError(error)) throw error;
  }

  return seeded ? normalizeProduct(seeded) : undefined;
}

/**
 * Get products by collection slug — targeted Firestore where() query.
 * Returns only the products needed, with a configurable limit.
 */
export async function getProductsByCollection(collectionSlug, maxResults = 12) {
  // Get matching seed products
  const seededMatching = collectionSlug
    ? seedProducts.filter((p) => p.collection === collectionSlug)
    : seedProducts;
  const seeded = seededMatching.map((p) => normalizeProductLite(p));

  try {
    const db = getFirebaseAdminDb();
    let q = db.collection("products").select(...LISTING_FIELDS).orderBy("createdAt", "desc").limit(maxResults);
    if (collectionSlug) {
      q = db
        .collection("products")
        .where("collection", "==", collectionSlug)
        .select(...LISTING_FIELDS)
        .limit(maxResults);
    }
    const snapshot = await q.get();
    const remote = snapshot.docs.map((doc) => normalizeProductLite(doc.data()));
    return mergeBySlug(seeded, remote);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return seeded;
    }
    throw error;
  }
}

/**
 * Get products by tag — targeted Firestore array-contains query.
 */
export async function getProductsByTag(tag, maxResults = 12) {
  // Get matching seed products
  const seededMatching = tag
    ? seedProducts.filter((p) => p.tags.includes(tag))
    : seedProducts;
  const seeded = seededMatching.map((p) => normalizeProductLite(p));

  if (!tag) {
    // No tag filter → get limited products
    return getProductsByCollection("", maxResults);
  }

  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db
      .collection("products")
      .where("tags", "array-contains", tag)
      .select(...LISTING_FIELDS)
      .limit(maxResults)
      .get();
    const remote = snapshot.docs.map((doc) => normalizeProductLite(doc.data()));
    return mergeBySlug(seeded, remote);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return seeded;
    }
    throw error;
  }
}

/**
 * Get new-sale products with a limit — targeted array-contains query.
 */
export async function getNewSaleProducts(limit = 4) {
  const seeded = seedProducts
    .filter((p) => p.tags.includes("new-sale"))
    .map((p) => normalizeProductLite(p));

  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db
      .collection("products")
      .where("tags", "array-contains", "new-sale")
      .select(...LISTING_FIELDS)
      .limit(limit)
      .get();
    const remote = snapshot.docs.map((doc) => normalizeProductLite(doc.data()));
    const merged = mergeBySlug(seeded, remote);
    return merged.slice(0, limit);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return seeded
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    }
    throw error;
  }
}

/**
 * Get related products — targeted query by collection, limited.
 */
export async function getRelatedProducts(product, limit = 4) {
  if (!product) {
    return [];
  }

  // Get from seed data
  const seededRelated = seedProducts
    .filter((candidate) => {
      return (
        candidate.slug !== product.slug &&
        (candidate.collection === product.collection ||
          candidate.tags.some((tag) => product.tags.includes(tag)))
      );
    })
    .map((p) => normalizeProductLite(p));

  try {
    const db = getFirebaseAdminDb();
    // Query products in the same collection (limited), only card fields
    const snapshot = await db
      .collection("products")
      .where("collection", "==", product.collection)
      .select(...LISTING_FIELDS)
      .limit(limit + 1) // fetch 1 extra in case current product is in the results
      .get();
    const remote = snapshot.docs
      .map((doc) => normalizeProductLite(doc.data()))
      .filter((p) => p.slug !== product.slug);

    const merged = mergeBySlug(seededRelated, remote);
    return merged.slice(0, limit);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return seededRelated.slice(0, limit);
    }
    throw error;
  }
}

/**
 * Get multiple products by their exact document IDs.
 * Chunking is handled internally for Firestore's 30-item 'in' query limit.
 */
export async function getProductsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  
  // Filter seed products
  const seeded = seedProducts
    .filter((p) => ids.includes(p._id))
    .map((p) => normalizeProductLite(p));
    
  try {
    const db = getFirebaseAdminDb();
    const batches = [];
    
    // Chunk into 30s
    for (let i = 0; i < ids.length; i += 30) {
      const batchIds = ids.slice(i, i + 30);
      batches.push(
        db.collection("products")
          .where(FieldPath.documentId(), "in", batchIds)
          .select(...LISTING_FIELDS)
          .get()
      );
    }
    
    const snapshots = await Promise.all(batches);
    const remote = snapshots.flatMap((snap) => snap.docs.map((doc) => normalizeProductLite(doc.data())));
    
    return mergeBySlug(seeded, remote);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return seeded;
    }
    throw error;
  }
}

/**
 * Get total product count — uses seed count + Firestore count.
 * Much cheaper than fetching all documents.
 */
export async function getProductCount() {
  const seedCount = seedProducts.length;

  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db.collection("products").count().get();
    const firestoreCount = snapshot.data().count;
    // Return the higher of the two since there may be overlap
    return Math.max(seedCount, firestoreCount + seedCount);
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return seedCount;
    }
    throw error;
  }
}

/**
 * Cursor-based paginated products for "Load More" feature.
 * Fetches the next batch of products after the given cursor (createdAt ISO string).
 * Returns { products, hasMore, nextCursor }.
 *
 * @param {Object} options
 * @param {string} [options.collection] - Filter by collection slug
 * @param {string} [options.tag] - Filter by tag
 * @param {string} [options.cursor] - ISO date string of last product's createdAt
 * @param {number} [options.limit] - Number of products to fetch (default 12)
 */
export async function getPaginatedProducts({ collection: collectionSlug, tag, cursor, limit: pageSize = 12 } = {}) {
  try {
    const db = getFirebaseAdminDb();

    // Build the base query
    let q = db.collection("products");

    if (collectionSlug) {
      q = q.where("collection", "==", collectionSlug);
    } else if (tag) {
      q = q.where("tags", "array-contains", tag);
    }

    // Apply field selection + ordering + limit
    q = q.select(...LISTING_FIELDS).orderBy("createdAt", "desc").limit(pageSize + 1);

    // Apply cursor (startAfter) if provided
    if (cursor) {
      q = q.startAfter(cursor);
    }

    const snapshot = await q.get();
    const docs = snapshot.docs;

    // If we got more than pageSize, there are more pages
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const products = resultDocs.map((doc) => normalizeProductLite(doc.data()));
    const nextCursor = resultDocs.length > 0
      ? resultDocs[resultDocs.length - 1].data().createdAt
      : null;

    // Convert Firestore Timestamp to ISO string for the cursor
    const nextCursorStr = nextCursor
      ? (typeof nextCursor === "string" ? nextCursor : toIsoDate(nextCursor))
      : null;

    return { products, hasMore, nextCursor: nextCursorStr };
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return { products: [], hasMore: false, nextCursor: null };
    }
    throw error;
  }
}

/**
 * Get just the slugs of all products — for generateStaticParams.
 * Only fetches the slug field to minimize data transfer.
 */
export async function getAllProductSlugs() {
  const seedSlugs = seedProducts.map((p) => p.slug);

  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db.collection("products").select("slug").get();
    const remoteSlugs = snapshot.docs.map((doc) => doc.data().slug);
    return [...new Set([...seedSlugs, ...remoteSlugs])];
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      return seedSlugs;
    }
    throw error;
  }
}

// ─── Admin write operations ───────────────────────────────────────────

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

  // Invalidate caches after write
  _cache.delete("collections_merged");
  _cache.delete("list_collections");

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

  // Invalidate caches after write
  _cache.delete("collections_merged");
  _cache.delete("list_collections");

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

  // Invalidate caches after write
  _cache.delete("products_merged");
  _cache.delete("list_products");

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

  // Invalidate caches after write
  _cache.delete("products_merged");
  _cache.delete("list_products");

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

  // Invalidate caches after write
  _cache.delete("products_merged");
  _cache.delete("list_products");
  
  return { success: true };
}
