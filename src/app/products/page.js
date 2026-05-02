import ProductCard from "@/components/ProductCard";
import {
  getCollections,
  getCollectionBySlug,
  getProducts,
  getProductsByCollection,
  getProductsByTag,
} from "@/lib/catalog-store";
import Link from "next/link";

export const revalidate = 60; // Revalidate cache every 60 seconds

const tagFilters = [
  { label: "All Edits", value: "" },
  { label: "Cotton-Silk", value: "cotton-silk" },
  { label: "Bridal", value: "bridal" },
  { label: "Pattu", value: "pattu" },
  { label: "Wedding", value: "wedding" },
  { label: "Couples", value: "couples" },
];

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const activeCollection = params?.collection || "";
  const activeTag = params?.tag || "";
  const [collections, products, collection, visibleProducts] = await Promise.all([
    getCollections(),
    getProducts(),
    getCollectionBySlug(activeCollection),
    activeCollection ? getProductsByCollection(activeCollection) : getProductsByTag(activeTag),
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
              <span className="mr-2 text-xs font-bold uppercase tracking-[0.12em] text-[#241f20]">Tags:</span>
              {tagFilters.map((filter) => {
                const href = filter.value ? `/products?tag=${filter.value}` : "/products";
                const isActive = filter.value === activeTag && !activeCollection;

                return (
                  <Link
                    key={filter.label}
                    href={href}
                    className={`rounded-full border px-5 py-2 text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? "border-[#8b001c] bg-[#8b001c] text-white"
                        : "border-[#ead8b7] text-[#241f20] hover:border-[#d8a734] hover:bg-[#fff4b8]"
                    }`}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>

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

          {/* Product Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-12 rounded-[8px] border border-dashed border-[#ead8b7] bg-[#f4f4f4] p-12 text-center">
              <p className="text-xl font-bold text-[#241f20]">No pieces found for this selection yet.</p>
              <p className="mt-2 text-sm text-[#5c4d43]">Please try exploring another category.</p>
            </div>
          ) : null}

          <div className="mt-16 border-t border-[#ead8b7] pt-8 text-center">
            <p className="text-xs font-medium tracking-wide text-[#5c4d43]">
              Showing {visibleProducts.length} of {products.length} catalog pieces
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
