"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/catalog";

import { Share2, ChevronRight } from "lucide-react";

function getDisplayPricing(price) {
  const originalPrice = Math.ceil(price / 0.83 / 10) * 10;
  return { originalPrice };
}

const formatCollectionName = (slug) => 
  slug?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Collection";

export default function ProductCard({ product }) {
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { originalPrice } = getDisplayPricing(product.price);

  useEffect(() => {
    if (!product.images || product.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [product?.images]);

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
    setWishlistMessage("Added");
    window.dispatchEvent(new Event("saree-wishlist-change"));
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

  const handleNextImage = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!product.images || product.images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  return (
    <Link prefetch={true} href={`/products/${product.slug}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(36,31,32,0.08)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#fcf7e6] hover:shadow-[0_14px_34px_rgba(139,0,28,0.18)]">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#eee8dd]">
          {product.images && product.images.map((img, index) => (
            <Image
              key={index}
              src={img || "/placeholder.jpg"}
              alt={`${product.name} - Image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-opacity duration-700 ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          {(!product.images || product.images.length === 0) && (
            <Image
              src="/placeholder.jpg"
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          )}

          {product.images && product.images.length > 1 && (
            <button
              onClick={handleNextImage}
              className="absolute top-1/2 right-2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/40 text-black/70 backdrop-blur-sm transition-all hover:bg-white/60 hover:text-black z-10"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div className="absolute -bottom-5 right-4 flex items-end gap-3">
            <div className="relative text-center">
              <button
                type="button"
                onClick={handleWishlist}
                title="Add to wishlist"
                className={`grid h-8 w-8 sm:h-11 sm:w-11 place-items-center rounded-full border bg-white shadow-[0_4px_18px_rgba(36,31,32,0.16)] transition-all duration-300 active:scale-90 ${isInWishlist ? 'border-[#8b001c] text-[#8b001c] scale-110 hover:scale-125' : 'border-[#ead8b7] text-[#cf2f61] hover:border-[#8b001c] hover:bg-[#fff4b8] hover:scale-110'}`}
              >
                <svg className="h-4 w-4 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill={isInWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
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
                title="Share this product"
                className="grid h-8 w-8 sm:h-11 sm:w-11 place-items-center rounded-full border border-[#ead8b7] bg-white text-[#d8a734] shadow-[0_4px_18px_rgba(36,31,32,0.16)] transition hover:border-[#d8a734] hover:bg-[#fff4b8]"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <p className="mt-1 text-[13px] text-[#241f20]">Share</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-end px-3 pb-5 pt-9">
          <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-widest text-[#d8a734] mb-1">
            {formatCollectionName(product.collection)}
          </p>
          <h3 className="line-clamp-2 text-[14px] sm:text-[18px] font-normal leading-tight text-[#1f1f1f] transition-colors group-hover:text-[#8b001c]">
            {product.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-[16px] sm:text-[18px] font-black text-black">{formatPrice(product.price)}</span>
            <span className="text-[13px] sm:text-[15px] font-medium text-[#8b8b8b] line-through">{formatPrice(originalPrice)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
