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
      </div>

      {message && (
        <p className="text-sm font-bold text-[#2f6b4f]">{message}</p>
      )}

    </div>
  );
}
