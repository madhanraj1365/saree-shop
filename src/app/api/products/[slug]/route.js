import { getProductBySlug, getRelatedProducts } from "@/lib/catalog-store";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(_request, { params }) {
  noStore();

  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json({ product, relatedProducts: await getRelatedProducts(product) });
}
