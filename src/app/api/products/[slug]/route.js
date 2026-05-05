import { getProductBySlug, getRelatedProducts } from "@/lib/catalog-store";
export const revalidate = 60;

export async function GET(_request, { params }) {

  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json({ product, relatedProducts: await getRelatedProducts(product) });
}
