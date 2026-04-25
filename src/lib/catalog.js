import { collections, products } from "@/data/catalog";

export function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function getNewSaleProducts(limit = 4) {
  return [...products]
    .filter((product) => product.tags.includes("new-sale"))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

export function getProductBySlug(slug) {
  return products.find((product) => product.slug === slug);
}

export function getCollectionBySlug(slug) {
  return collections.find((collection) => collection.slug === slug);
}

export function getProductsByCollection(collectionSlug) {
  if (!collectionSlug) {
    return products;
  }

  return products.filter((product) => product.collection === collectionSlug);
}

export function getProductsByTag(tag) {
  if (!tag) {
    return products;
  }

  return products.filter((product) => product.tags.includes(tag));
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) {
    return [];
  }

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
