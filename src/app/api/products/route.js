import { getProducts } from "@/lib/catalog-store";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(request) {
  noStore();

  const { searchParams } = new URL(request.url);
  const collection = searchParams.get("collection");
  const tag = searchParams.get("tag");
  const products = await getProducts();

  const filtered = products.filter((product) => {
    if (collection) {
      return product.collection === collection;
    }

    if (tag) {
      return product.tags.includes(tag);
    }

    return true;
  });

  return Response.json({ products: filtered });
}
