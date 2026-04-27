"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/catalog";
import { shopDetails } from "@/lib/shop";

const shopWhatsAppNumber = shopDetails.whatsappDigits;

export default function CartClient() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/cart", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setItems(data.items || []);
          }
        } catch (err) {
          console.error("Failed to load cloud cart", err);
          setItems([]);
        }
      } else {
        setItems(JSON.parse(localStorage.getItem("sareeCart") || "[]"));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (isMounted) {
          setProducts(data.products || []);
          setIsLoaded(true);
        }
      } catch {
        if (isMounted) {
          setProducts([]);
          setIsLoaded(true);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const cartProducts = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((candidate) => candidate._id === item.productId);
        return product ? { ...product, quantity: item.quantity } : null;
      })
      .filter(Boolean);
  }, [items, products]);

  const total = cartProducts.reduce((sum, product) => sum + product.price * product.quantity, 0);
  const remainingForShipping = Math.max(0, 3000 - total);
  const progress = Math.min(100, Math.round((total / 3000) * 100));

  async function persistItems(newItems) {
    setItems(newItems);

    const auth = getFirebaseClientAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken();
        await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items: newItems }),
        });
      } catch (err) {
        console.error("Cloud cart update failed", err);
      }
    } else {
      localStorage.setItem("sareeCart", JSON.stringify(newItems));
    }

    window.dispatchEvent(new Event("saree-cart-change"));
  }

  async function proceedToCheckout() {
    setIsProcessingOrder(true);

    try {
      const auth = getFirebaseClientAuth();
      const user = auth.currentUser;

      if (!user) {
        sessionStorage.setItem("postLoginRedirect", "/checkout/address");
        router.push("/login");
        return;
      }

      router.push("/checkout/address");
    } catch (error) {
      console.error("Error proceeding to checkout:", error);
      alert("Failed to proceed. Please try again.");
    } finally {
      setIsProcessingOrder(false);
    }
  }

  function updateQuantity(productId, delta) {
    const newItems = items.map((item) => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    persistItems(newItems);
  }

  function removeFromCart(productId) {
    persistItems(items.filter((item) => item.productId !== productId));
  }

  if (items.length > 0 && !isLoaded) {
    return (
      <div className="mt-12 rounded-[8px] border border-dashed border-[#ead8b7] bg-[#f4f4f4] p-12 text-center">
        <p className="text-xl font-bold text-[#8b001c] animate-pulse">Loading your shopping bag...</p>
      </div>
    );
  }

  if (!cartProducts.length) {
    return (
      <div className="mt-12 flex flex-col items-center rounded-[8px] border border-dashed border-[#ead8b7] bg-[#f4f4f4] p-12 text-center">
        <p className="text-2xl font-black text-[#241f20]">Your shopping bag is empty</p>
        <p className="mt-3 text-sm text-[#6d6064]">Add your favorite sarees and come back here to check out.</p>
        <Link
          href="/products"
          className="mt-8 rounded-[6px] bg-[#8b001c] px-8 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#5f0015]"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-center text-sm text-[#241f20]">
          {remainingForShipping > 0
            ? `Add products for ${formatPrice(remainingForShipping)} more to enjoy free shipping within India`
            : "You are eligible for free shipping within India"}
        </p>
        <div className="mx-auto mt-2 h-1 max-w-md overflow-hidden rounded-full bg-[#ead8b7]">
          <div className="h-full bg-[#8b001c]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal text-[#241f20]">Shopping Bag</h1>
          <p className="mt-2 text-sm text-[#777]">Shipping and taxes calculated at checkout</p>
        </div>
        <Link href="/products" className="text-sm font-bold uppercase tracking-[0.12em] text-[#241f20] hover:text-[#8b001c]">
          Go Back
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_292px]">
        <div>
          <div className="hidden grid-cols-[1fr_140px_120px] bg-white px-2 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[#111] md:grid">
            <span>Product</span>
            <span className="text-center">Quantity</span>
            <span className="text-center">Price</span>
          </div>

          <div className="space-y-4 md:space-y-0">
            {cartProducts.map((product) => (
              <div
                key={product._id}
                className="grid gap-4 rounded-[8px] bg-white p-4 shadow-sm md:grid-cols-[1fr_140px_120px_44px] md:items-center md:rounded-none md:bg-transparent md:px-1 md:py-6 md:shadow-none"
              >
                <div className="flex items-center gap-4">
                  <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-[6px] bg-[#eee8dd] md:h-28 md:w-20">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <Link href={`/products/${product.slug}`} className="text-sm font-normal leading-tight text-black hover:text-[#8b001c]">
                      {product.name}
                    </Link>
                    <p className="mt-2 text-[11px] text-[#777]">Addon:</p>
                    <p className="text-[11px] text-[#777]">1 m Matching Blouse Fabric - Rs. 200</p>
                  </div>
                </div>

                <div className="flex items-center justify-start gap-4 md:justify-center">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product._id, -1)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-[#8b001c] text-lg leading-none text-white transition hover:bg-[#5f0015]"
                    aria-label={`Decrease quantity for ${product.name}`}
                  >
                    -
                  </button>
                  <span className="min-w-[2ch] text-center text-sm text-[#241f20]">{product.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product._id, 1)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-[#b8797f] text-lg leading-none text-white transition hover:bg-[#8b001c]"
                    aria-label={`Increase quantity for ${product.name}`}
                  >
                    +
                  </button>
                </div>

                <div className="text-sm font-normal text-[#111] md:text-center">
                  Pcs {formatPrice(product.price * product.quantity)}
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(product._id)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[#8b001c] text-white transition hover:bg-[#5f0015]"
                  title="Remove item"
                  aria-label={`Remove ${product.name}`}
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 7V5c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h4v2h-1v10c0 1.7-1.3 3-3 3H8c-1.7 0-3-1.3-3-3V9H4V7h4Zm2 0h4V5h-4v2Zm-3 2v10c0 .6.4 1 1 1h8c.6 0 1-.4 1-1V9H7Zm3 2h2v7h-2v-7Zm4 0h2v7h-2v-7Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[6px] bg-white px-4 py-4 text-center text-xs font-bold uppercase tracking-[0.12em] text-[#111] shadow-sm">
            Delivery
          </div>

          <div className="rounded-[6px] bg-white shadow-sm">
            <div className="flex items-start justify-between border-b border-[#eeeeee] p-4">
              <div>
                <h2 className="text-lg font-normal uppercase text-[#241f20]">Bag Total</h2>
                <p className="text-xs text-[#777]">({cartProducts.length} Items)</p>
              </div>
              <p className="text-lg font-normal text-[#241f20]">{formatPrice(total)}</p>
            </div>
            <div className="space-y-2 p-4">
              <Link
                href="/products"
                className="flex w-full items-center justify-center rounded-[5px] bg-[#fff4b8] py-3 text-xs font-black uppercase tracking-[0.08em] text-[#8b001c] transition hover:bg-[#ffe878]"
              >
                Continue Shopping
              </Link>
              <button
                type="button"
                onClick={proceedToCheckout}
                disabled={isProcessingOrder}
                className="flex w-full items-center justify-center rounded-[5px] bg-[#ef3f2f] py-3 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#8b001c] disabled:opacity-70"
              >
                {isProcessingOrder ? "Processing..." : "Checkout"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
