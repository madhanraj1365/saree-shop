import ProductGrid from "@/components/ProductGrid";
import {
  getCollections,
  getCollectionBySlug,
  getProductsByCollection,
  getProductsByTag,
  getProductCount,
} from "@/lib/catalog-store";
import Link from "next/link";

export const revalidate = 300; // Revalidate cache every 5 minutes



export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const activeCollection = params?.collection || "";
  const activeTag = params?.tag || "";
  const [collections, collection, visibleProducts, totalCount] = await Promise.all([
    getCollections(),
    activeCollection ? getCollectionBySlug(activeCollection) : Promise.resolve(undefined),
    activeCollection ? getProductsByCollection(activeCollection) : getProductsByTag(activeTag),
    getProductCount(),
  ]);

  return (
    <>
      <main className="min-h-screen bg-white">
        {/* Header Section */}
        <section className="border-b border-[#ead8b7] bg-[#f4f4f4] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1600px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d8a734]">
              The Digital Showroom
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-wide text-[#241f20] sm:text-5xl">
              {collection ? collection.name : activeTag ? `${activeTag} Sarees` : "All Products"}
            </h1>
            <div className="mx-auto mt-4 h-[2px] w-12 bg-[#d8a734]" />
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5c4d43]">
              Browse every saree in our curated catalog. Collection cards from the home
              page open this same showroom with the matching filter applied.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="mb-12 space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="mr-2 text-xs font-bold uppercase tracking-[0.12em] text-[#241f20]">Collections:</span>
              {collections.map((item) => {
                const isActive = item.slug === activeCollection;

                return (
                  <Link
                    key={item.slug}
                    href={`/products?collection=${item.slug}`}
                    className={`rounded-full border px-5 py-2 text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? "border-[#d8a734] bg-[#fff4b8] text-[#8b001c]"
                        : "border-transparent bg-[#f4f4f4] text-[#241f20] hover:border-[#ead8b7]"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Product Grid with Load More */}
          <ProductGrid
            initialProducts={visibleProducts}
            totalCount={totalCount}
            collection={activeCollection}
            tag={activeTag}
          />
        </section>
      </main>
    </>
  );
}
