"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/catalog";

function getDisplayPricing(price) {
  const originalPrice = Math.ceil(price / 0.83 / 10) * 10;
  const discount = Math.max(1, Math.round(((originalPrice - price) / originalPrice) * 100));

  return { originalPrice, discount };
}

export default function ProductCard({ product }) {
  const [wishlistMessage, setWishlistMessage] = useState("");
  const { originalPrice, discount } = getDisplayPricing(product.price);

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const items = JSON.parse(localStorage.getItem("sareeWishlist") || "[]");
    if (!items.find((item) => item.productId === product._id)) {
      items.push({ productId: product._id, quantity: 1 });
      localStorage.setItem("sareeWishlist", JSON.stringify(items));
    }
    setWishlistMessage("Added");
    setTimeout(() => setWishlistMessage(""), 1800);

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

  const handleShare = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const url = `${window.location.origin}/products/${product.slug}`;
    const text = `Check out this beautiful saree: ${product.name}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Link prefetch={true} href={`/products/${product.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(36,31,32,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(95,0,21,0.14)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#eee8dd]">
          <Image
            src={product.images[0] || "/placeholder.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />

          <div className="absolute -bottom-5 right-4 flex items-end gap-3">
            <div className="relative text-center">
              <button
                type="button"
                onClick={handleWishlist}
                title="Add to wishlist"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#ead8b7] bg-white text-[#cf2f61] shadow-[0_4px_18px_rgba(36,31,32,0.16)] transition hover:border-[#cf2f61] hover:bg-[#fff4b8]"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                </svg>
              </button>
              {wishlistMessage ? (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-[#241f20] px-2 py-1 text-[10px] font-bold text-white">
                  {wishlistMessage}
                </span>
              ) : null}
              <p className="mt-1 text-[13px] text-[#241f20]">0 Likes</p>
            </div>
            <div className="text-center">
              <button
                type="button"
                onClick={handleShare}
                title="Share on WhatsApp"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#bce5c6] bg-white text-[#32b54a] shadow-[0_4px_18px_rgba(36,31,32,0.16)] transition hover:border-[#32b54a] hover:bg-[#effff2]"
              >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.5 14.4c-.3-.1-1.8-.9-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5 0-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4Zm-5.4 7.4A9.9 9.9 0 0 1 7 20.4l-.4-.2-3.7 1 1-3.7-.2-.4A9.9 9.9 0 1 1 12.1 21.8Z" />
                </svg>
              </button>
              <p className="mt-1 text-[13px] text-[#241f20]">Share</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-end px-3 pb-5 pt-9">
          <h3 className="line-clamp-1 text-[18px] font-normal leading-tight text-[#1f1f1f] transition-colors group-hover:text-[#8b001c]">
            {product.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-[18px] font-black text-black">{formatPrice(product.price)}</span>
            <span className="text-[15px] font-medium text-[#8b8b8b] line-through">{formatPrice(originalPrice)}</span>
            <span className="text-[15px] font-bold text-[#78bf18]">{discount}% Off</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
