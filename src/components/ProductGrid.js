"use client";

import { useState, useCallback } from "react";
import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ initialProducts, totalCount, collection, tag }) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length >= 12);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      // Use the createdAt of the last product as cursor
      const lastProduct = products[products.length - 1];
      const cursor = lastProduct?.createdAt || "";

      const params = new URLSearchParams();
      if (collection) params.set("collection", collection);
      if (tag) params.set("tag", tag);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "12");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.products && data.products.length > 0) {
        // Deduplicate by slug (seed data overlap)
        const existingSlugs = new Set(products.map((p) => p.slug));
        const newProducts = data.products.filter((p) => !existingSlugs.has(p.slug));
        setProducts((prev) => [...prev, ...newProducts]);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more products:", err);
    } finally {
      setLoading(false);
    }
  }, [products, loading, hasMore, collection, tag]);

  return (
    <>
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id || product.slug} product={product} />
        ))}
      </div>

      {products.length === 0 ? (
        <div className="mt-12 rounded-[8px] border border-dashed border-[#ead8b7] bg-[#f4f4f4] p-12 text-center">
          <p className="text-xl font-bold text-[#241f20]">No pieces found for this selection yet.</p>
          <p className="mt-2 text-sm text-[#5c4d43]">Please try exploring another category.</p>
        </div>
      ) : null}

      {/* Load More */}
      {hasMore && (
        <div className="mt-14 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group relative flex items-center gap-2 rounded-full border border-[#d8a734] bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8b001c] transition-all hover:bg-[#fff4b8] hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading...
              </>
            ) : (
              "Load More Sarees"
            )}
          </button>
        </div>
      )}

      {/* Footer count */}
      <div className="mt-16 border-t border-[#ead8b7] pt-8 text-center">
        <p className="text-xs font-medium tracking-wide text-[#5c4d43]">
          Showing {products.length} of {totalCount} catalog pieces
        </p>
      </div>
    </>
  );
}
