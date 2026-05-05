"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ProductCacheContext = createContext(null);

const CACHE_KEY = "product-cache";
const TTL = 10 * 60 * 1000; // 10 minutes

const getSavedCache = () => {
  if (typeof window === "undefined") return {};
  try {
    const saved = sessionStorage.getItem(CACHE_KEY);
    if (!saved) return {};
    
    const parsed = JSON.parse(saved);
    const now = Date.now();
    const validCache = {};
    
    // Check TTL for each item
    for (const [id, entry] of Object.entries(parsed)) {
      if (entry && entry.cachedAt && (now - entry.cachedAt < TTL)) {
        validCache[id] = entry;
      }
    }
    return validCache;
  } catch {
    return {};
  }
};

export function ProductCacheProvider({ children }) {
  const [cache, setCache] = useState(getSavedCache);

  const fetchProducts = useCallback(async (productIds) => {
    if (!productIds || productIds.length === 0) return;
    
    const now = Date.now();
    // Use the latest state to check what is missing, rather than closure state if possible,
    // but useCallback dependency on cache means it's mostly fresh.
    const missingIds = productIds.filter(id => {
      const entry = cache[id];
      // Fetch if missing or expired
      return !entry || !entry.cachedAt || (now - entry.cachedAt >= TTL);
    });

    if (missingIds.length === 0) return;

    try {
      const res = await fetch(`/api/products?ids=${missingIds.join(",")}`);
      if (res.ok) {
        const data = await res.json();
        
        setCache(prev => {
          const updated = { ...prev };
          const fetchTime = Date.now();
          
          data.products.forEach(p => {
            updated[p._id] = {
              data: p,
              cachedAt: fetchTime
            };
          });

          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            } catch (err) {
              console.warn("Failed to persist product cache", err);
            }
          }
          
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to fetch products for cache", err);
    }
  }, [cache]);

  return (
    <ProductCacheContext.Provider value={{ cache, fetchProducts }}>
      {children}
    </ProductCacheContext.Provider>
  );
}

export function useProductCache() {
  const context = useContext(ProductCacheContext);
  if (!context) {
    throw new Error("useProductCache must be used within a ProductCacheProvider");
  }
  return context;
}
