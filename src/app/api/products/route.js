import { getProductsByCollection, getProductsByTag, getPaginatedProducts, getProductsByIds } from "@/lib/catalog-store";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(request) {
  noStore();

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const collection = searchParams.get("collection") || "";
  const excludeCollection = searchParams.get("excludeCollection") || "";
  const tag = searchParams.get("tag") || "";
  const cursor = searchParams.get("cursor") || "";
  const limit = Math.min(Number(searchParams.get("limit")) || 12, 24); // cap at 24

  // If specific IDs are requested, bypass other filters
  if (idsParam) {
    const ids = idsParam.split(",").map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      return Response.json({ products: [] });
    }
    const products = await getProductsByIds(ids);
    return Response.json({ products });
  }

  // If cursor is provided → paginated "Load More" request
  if (cursor) {
    const result = await getPaginatedProducts({
      collection: collection || undefined,
      excludeCollection: excludeCollection || undefined,
      tag: tag || undefined,
      cursor,
      limit,
    });
    return Response.json(result);
  }

  // Initial load (no cursor) — used for first page SSR fallback
  let products;
  if (collection) {
    products = await getProductsByCollection(collection, limit);
  } else if (tag) {
    products = await getProductsByTag(tag, limit);
  } else {
    products = await getProductsByCollection("", limit);
  }

  return Response.json({ products, hasMore: products.length >= limit, nextCursor: null });
}
