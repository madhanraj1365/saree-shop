"use client";

import { useState, useCallback } from "react";
import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ initialProducts, totalCount, collection, tag }) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false);
  
  // If we fetched < 12 items and a collection is active, the collection is exhausted.
  // We can immediately switch to fetching excluded items.
  const isCollectionExhausted = collection && initialProducts.length < 12;
  const [isFetchingExcluded, setIsFetchingExcluded] = useState(isCollectionExhausted);
  const [hasMore, setHasMore] = useState(initialProducts.length >= 12 || isCollectionExhausted);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const lastProduct = products[products.length - 1];
      // Reset cursor if we just switched to Phase 2
      const isSwitchingPhase = collection && !isFetchingExcluded && (!lastProduct || products.filter(p => p.collection === collection).length === products.length);
      // Wait, to be perfectly safe with cursors, if we switch to phase 2, we should NOT pass a cursor!
      // Actually, if `isFetchingExcluded` is true, the `products` array contains items from the excluded collection too.
      // So the cursor should be the last product THAT IS FROM THE EXCLUDED phase.
      // Let's find the last product that is NOT from `collection`.
      let cursor = lastProduct?.createdAt || "";
      if (isFetchingExcluded && collection) {
        const phase2Products = products.filter(p => p.collection !== collection);
        if (phase2Products.length > 0) {
          cursor = phase2Products[phase2Products.length - 1].createdAt || "";
        } else {
          cursor = ""; // no phase 2 products yet, start from beginning
        }
      } else if (collection && !isFetchingExcluded) {
         // phase 1 cursor
         cursor = lastProduct?.createdAt || "";
      }

      const params = new URLSearchParams();
      if (collection) {
        if (isFetchingExcluded) {
          params.set("excludeCollection", collection);
        } else {
          params.set("collection", collection);
        }
      } else if (tag) {
        params.set("tag", tag);
      }
      
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "12");

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      let newlyFetched = data.products || [];
      
      if (newlyFetched.length > 0) {
        const existingSlugs = new Set(products.map((p) => p.slug));
        const newProducts = newlyFetched.filter((p) => !existingSlugs.has(p.slug));
        setProducts((prev) => [...prev, ...newProducts]);
        
        if (data.hasMore) {
          setHasMore(true);
        } else if (collection && !isFetchingExcluded) {
          setIsFetchingExcluded(true);
          setHasMore(true); // switch to phase 2
        } else {
          setHasMore(false);
        }
      } else {
        if (collection && !isFetchingExcluded) {
          setIsFetchingExcluded(true);
          setHasMore(true); // try phase 2 on next click
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Failed to load more products:", err);
    } finally {
      setLoading(false);
    }
  }, [products, loading, hasMore, collection, tag, isFetchingExcluded]);

  return (
    <>
      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
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
