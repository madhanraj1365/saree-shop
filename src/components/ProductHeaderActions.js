"use client";

import { useState, useEffect } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { Share2 } from "lucide-react";

export default function ProductHeaderActions({ product }) {
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const checkWishlist = () => {
      const items = JSON.parse(localStorage.getItem("sareeWishlist") || "[]");
      setIsInWishlist(items.some((item) => item.productId === product._id));
    };
    checkWishlist();
    window.addEventListener("saree-wishlist-change", checkWishlist);
    return () => window.removeEventListener("saree-wishlist-change", checkWishlist);
  }, [product._id]);

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const items = JSON.parse(localStorage.getItem("sareeWishlist") || "[]");
    if (!items.find((item) => item.productId === product._id)) {
      items.push({ productId: product._id, quantity: 1 });
      localStorage.setItem("sareeWishlist", JSON.stringify(items));
    }
    setIsInWishlist(true);
    window.dispatchEvent(new Event("saree-wishlist-change"));

    const auth = getFirebaseClientAuth();
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        const getRes = await fetch("/api/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        let cloudItems = [];
        if (getRes.ok) {
          const data = await getRes.json();
          cloudItems = data.items || [];
        }
        if (!cloudItems.find((item) => item.productId === product._id)) {
          cloudItems.push({ productId: product._id, quantity: 1 });
          await fetch("/api/wishlist", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ items: cloudItems }),
          });
        }
      } catch (err) {
        console.error("Failed to sync wishlist", err);
      }
    }
  };

  const handleShare = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}/products/${product.slug}`;
    const text = `Check out this beautiful saree: ${product.name}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: text,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n\n${url}`);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        title="Share this product"
        className="grid h-10 w-10 place-items-center rounded-full border border-[#ead8b7] bg-white text-[#d8a734] shadow-sm transition hover:border-[#d8a734] hover:bg-[#fff4b8]"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={handleWishlist}
        title="Add to wishlist"
        className={`grid h-10 w-10 place-items-center rounded-full border bg-white shadow-sm transition-all duration-300 active:scale-90 ${isInWishlist ? 'border-[#8b001c] text-[#8b001c] scale-110 hover:scale-125' : 'border-[#ead8b7] text-[#cf2f61] hover:border-[#8b001c] hover:bg-[#fff4b8] hover:scale-110'}`}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill={isInWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </button>
    </div>
  );
}
