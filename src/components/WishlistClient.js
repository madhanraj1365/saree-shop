"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/catalog";
import { useProductCache } from "@/context/ProductCacheContext";

export default function WishlistClient() {
  const [items, setItems] = useState([]);
  const { cache, fetchProducts } = useProductCache();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/wishlist", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setItems(data.items || []);
          }
        } catch (err) {
          console.error("Failed to load cloud wishlist", err);
          setItems([]);
        }
      } else {
        setItems(JSON.parse(localStorage.getItem("sareeWishlist") || "[]"));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setIsLoaded(true);
      return;
    }
    
    const productIds = items.map(item => item.productId);
    fetchProducts(productIds).finally(() => {
      setIsLoaded(true);
    });
  }, [items, fetchProducts]);

  const wishProducts = useMemo(() => {
    return items
      .map((item) => {
        const entry = cache[item.productId];
        return entry ? entry.data : null;
      })
      .filter(Boolean);
  }, [items, cache]);

  async function removeFromWishlist(productId) {
    const newItems = items.filter(item => item.productId !== productId);
    setItems(newItems);

    localStorage.setItem("sareeWishlist", JSON.stringify(newItems));
    window.dispatchEvent(new CustomEvent("saree-wishlist-change", { detail: { action: 'remove' } }));

    const auth = getFirebaseClientAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();
        await fetch("/api/wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ items: newItems })
        });
      } catch (err) {
        console.error("Cloud wishlist remove failed", err);
      }
    }
  }

  if (items.length > 0 && !isLoaded) {
    return (
      <div className="mt-12 rounded-xl border border-dashed border-[#eaddcf] bg-[#fbf9f6] p-12 text-center">
        <p className="font-serif text-xl text-[#4a3b32] animate-pulse">Loading your wishlist...</p>
      </div>
    );
  }

  return wishProducts.length ? (
    <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {wishProducts.map((product) => (
        <div
          key={product._id}
          className="group relative overflow-hidden rounded-xl border border-[#eaddcf] bg-white transition-all hover:shadow-lg"
        >
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
          <div className="p-6">
            <h3 className="font-serif text-xl text-[#2c2420]">{product.name}</h3>
            <p className="mt-2 text-[#d4af37] font-semibold">{formatPrice(product.price)}</p>
            <div className="mt-6 flex items-center justify-between">
              <Link
                href={`/products/${product.slug}`}
                className="text-xs font-bold uppercase tracking-widest text-[#4a3b32] hover:text-[#d4af37]"
              >
                View Piece
              </Link>
              <button
                onClick={() => removeFromWishlist(product._id)}
                className="text-[10px] font-bold uppercase tracking-widest text-[#8e1f3f] hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="mt-12 rounded-xl border border-dashed border-[#eaddcf] bg-[#fbf9f6] p-16 text-center">
      <p className="font-serif text-2xl text-[#4a3b32]">Your wishlist is waiting to be filled.</p>
      <Link
        href="/products"
        className="mt-8 inline-block rounded-full bg-[#2c2420] px-8 py-3 text-sm font-bold uppercase tracking-[0.15em] text-white transition-transform hover:scale-105"
      >
        Explore Collections
      </Link>
    </div>
  );
}
