"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

async function writeToCloud(apiPath, productId, quantity = 1) {
  const auth = getFirebaseClientAuth();
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const token = await user.getIdToken();
    const getRes = await fetch(apiPath, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let items = [];
    if (getRes.ok) {
      const data = await getRes.json();
      items = data.items || [];
    }

    const existing = items.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId, quantity });
    }

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
    if (user) {
      setMessage("Syncing with your account...");
      const success = await writeToCloud("/api/cart", product._id, quantity);
      if (success) {
        window.dispatchEvent(new Event("saree-cart-change"));
        setMessage("Added to cart!");
      } else {
        setMessage("Failed to sync. Please try again.");
      }
    } else {
      writeList("sareeCart", product._id, quantity);
      window.dispatchEvent(new Event("saree-cart-change"));
      setMessage("Added to local cart. Sign in to save it permanently.");
    }
    setTimeout(() => setMessage(""), 3000);
  }

  const handleBuyNow = () => {
    // Current site uses WhatsApp
    const url = `${window.location.origin}/products/${product.slug}`;
    const text = `Hi, I would like to order ${quantity}x "${product.name}"\nPrice: Rs.${product.price} each\n\nLink: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

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
          className="w-full sm:w-auto min-w-[160px] rounded-[4px] bg-[#333333] px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#222222]"
        >
          Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="w-full sm:w-auto min-w-[160px] rounded-[4px] bg-[#d8a734] px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#c4962d]"
        >
          Buy Now
        </button>
      </div>

      {message && (
        <p className="text-sm font-bold text-[#2f6b4f]">{message}</p>
      )}

      {/* Share Section */}
      <div className="pt-4">
        <p className="mb-3 text-xs font-bold text-[#241f20]">Share It</p>
        <div className="flex items-center gap-3">
          <button onClick={shareOnWhatsApp} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25d366] text-white transition hover:opacity-80">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.5 14.4c-.3-.1-1.8-.9-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2.1-.4 0-.5 0-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4Zm-5.4 7.4A9.9 9.9 0 0 1 7 20.4l-.4-.2-3.7 1 1-3.7-.2-.4A9.9 9.9 0 1 1 12.1 21.8Z" />
            </svg>
          </button>
          <button onClick={shareOnFacebook} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877f2] text-white transition hover:opacity-80">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
            </svg>
          </button>
          <button onClick={shareOnTwitter} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1da1f2] text-white transition hover:opacity-80">
             <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
