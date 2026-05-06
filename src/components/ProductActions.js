"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

async function writeToCloud(apiPath, items) {
  const auth = getFirebaseClientAuth();
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const token = await user.getIdToken();
    await fetch(apiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });
    return true;
  } catch (err) {
    console.error(`Failed to sync to ${apiPath}`, err);
    return false;
  }
}

function writeList(key, productId, quantity = 1) {
  const items = JSON.parse(localStorage.getItem(key) || "[]");
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }

  localStorage.setItem(key, JSON.stringify(items));
}

export default function ProductActions({ product }) {
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [justAddedToCart, setJustAddedToCart] = useState(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleDecrease = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncrease = () => setQuantity((q) => Math.min(product.stock || 10, q + 1));

  async function addToCart() {
    // 1. Update localStorage immediately
    const items = JSON.parse(localStorage.getItem("sareeCart") || "[]");
    const existing = items.find((item) => item.productId === product._id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId: product._id, quantity });
    }
    localStorage.setItem("sareeCart", JSON.stringify(items));

    // 2. Fire event immediately — Header updates instantly from localStorage
    window.dispatchEvent(new CustomEvent("saree-cart-change", { detail: { action: 'add' } }));

    // 3. Show button animation immediately
    setJustAddedToCart(true);
    setMessage("Added to cart!");
    setTimeout(() => setJustAddedToCart(false), 800);
    setTimeout(() => setMessage(""), 3000);

    // 4. Sync to cloud in background — no waiting
    if (user) {
      writeToCloud("/api/cart", items); // no await — runs in background
    }
  }



  const shareOnWhatsApp = () => {
    const url = `${window.location.origin}/products/${product.slug}`;
    const text = `Check out this beautiful saree: ${product.name}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnFacebook = () => {
    const url = `${window.location.origin}/products/${product.slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const shareOnTwitter = () => {
    const url = `${window.location.origin}/products/${product.slug}`;
    const text = `Check out this beautiful saree: ${product.name}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Quantity section */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#241f20]">Quantity</p>
        <div className="flex h-10 w-28 items-center justify-between rounded border border-[#eaddcf] bg-[#fbf9f6] px-3">
          <button onClick={handleDecrease} className="text-xl font-bold text-[#8b001c] hover:opacity-70">&minus;</button>
          <span className="font-bold text-[#241f20]">{quantity}</span>
          <button onClick={handleIncrease} className="text-xl font-bold text-[#8b001c] hover:opacity-70">+</button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={addToCart}
          className={`flex items-center justify-center gap-2 w-full sm:w-auto min-w-[160px] rounded-[4px] px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all duration-500 ${justAddedToCart ? 'bg-[#8b001c] scale-105 shadow-lg shadow-[#8b001c]/40' : 'bg-[#333333] hover:bg-[#222222] active:scale-95'}`}
        >
          <svg className={`h-5 w-5 transition-all duration-500 ${justAddedToCart ? 'scale-125 translate-x-1 rotate-12' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 9h-12L6 6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6 5.4 3H3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          </svg>
          {justAddedToCart ? "Added!" : "Add to Cart"}
        </button>
      </div>

      {message && (
        <p className="text-sm font-bold text-[#2f6b4f]">{message}</p>
      )}

    </div>
  );
}
