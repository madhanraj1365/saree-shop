"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/catalog";

export default function OrderSummaryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [address, setAddress] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load address from session
    const savedAddress = sessionStorage.getItem("checkoutAddress");
    if (!savedAddress) {
      router.push("/profile");
      return;
    }
    // eslint-disable-next-line
    setAddress(JSON.parse(savedAddress));

    // Load Cart
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

    // Load Products
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(data.products || []);
        setIsLoaded(true);
      } catch {
        setProducts([]);
        setIsLoaded(true);
      }
    }

    loadProducts();

    return () => unsubscribe();
  }, [router]);

  const cartProducts = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((candidate) => candidate._id === item.productId);
        return product ? { ...product, quantity: item.quantity } : null;
      })
      .filter(Boolean);
  }, [items, products]);

  const subtotal = cartProducts.reduce((sum, product) => sum + product.price * product.quantity, 0);
  const shipping = subtotal > 3000 ? 0 : 80;
  const giftWrapFee = giftWrap ? 30 : 0;
  const amountPayable = subtotal + shipping + giftWrapFee;

  const handleRazorpay = async () => {
    setIsProcessing(true);
    try {
      const auth = getFirebaseClientAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      if (!token) {
        alert("Please sign in to place an order.");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartProducts,
          address,
          subtotal,
          shipping,
          giftWrapFee,
          totalAmount: amountPayable
        })
      });

      if (!res.ok) {
        let errMsg = "Failed to place order.";
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch(e) {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      
      // Clear local cart
      localStorage.removeItem("sareeCart");
      window.dispatchEvent(new Event("saree-cart-change"));

      router.push(`/checkout/confirmation?billId=${data.billId}&amount=${amountPayable}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Something went wrong while placing the order.");
      setIsProcessing(false);
    }
  };

  if (!isLoaded || !address) {
    return (
      <main className="min-h-screen bg-[#faf9f8] py-10 text-center">
        <p className="animate-pulse text-[#8b001c] font-bold">Loading Order Summary...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f8]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Top Navigation */}
        <div className="mb-8">
          <Link href="/profile" className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#555] hover:text-[#8b001c]">
            <span>&larr;</span> GO BACK
          </Link>
          <div className="mt-4 flex gap-2 text-[10px] uppercase tracking-widest text-[#888]">
            <Link href="/" className="hover:text-[#241f20]">HOME</Link>
            <span>&rsaquo;</span>
            <Link href="/profile" className="hover:text-[#241f20]">ADDRESS</Link>
            <span>&rsaquo;</span>
            <span className="font-bold text-[#241f20]">ORDER DETAILS</span>
          </div>
          <h1 className="mt-6 font-serif text-2xl text-[#241f20]">Order Summary & Payment</h1>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left Column */}
          <div className="space-y-8">
            
            {/* Your Selection */}
            <section className="bg-white p-8 shadow-sm">
              <h2 className="mb-6 font-serif text-lg text-[#241f20]">Your Selection</h2>
              <div className="space-y-6">
                {cartProducts.map((product) => (
                  <div key={product._id} className="flex gap-6 border-b border-[#eee] pb-6 last:border-0 last:pb-0">
                    <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden bg-[#f4f4f4]">
                      <Image
                        src={product.images[0] || "/placeholder.jpg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-base text-[#241f20]">{product.name}</h3>
                        <p className="mt-1 text-xs text-[#777]">Authentic Handcrafted Silk</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="text-xs uppercase tracking-widest text-[#555]">
                          QUANTITY: <span className="font-bold text-[#241f20]">{product.quantity} Pcs</span>
                        </p>
                        <p className="font-serif text-lg font-bold text-[#241f20]">
                          {formatPrice(product.price * product.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Addresses */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Shipping Address */}
              <section className="bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#555]">SHIPPING ADDRESS</h3>
                  <Link href="/profile" className="text-[10px] font-bold text-[#d8a734] underline hover:text-[#c4962d]">CHANGE</Link>
                </div>
                <div className="space-y-1 text-sm text-[#333]">
                  <p className="font-bold">{address.fullName}</p>
                  <p>{address.completeAddress}</p>
                  <p>{address.landmark}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                  <p>{address.country}</p>
                  <p className="mt-2 text-xs text-[#777]">T: +91 {address.mobileNo}</p>
                </div>
              </section>

              {/* Billing Address */}
              <section className="bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#555]">BILLING ADDRESS</h3>
                  <Link href="/profile" className="text-[10px] font-bold text-[#d8a734] underline hover:text-[#c4962d]">CHANGE</Link>
                </div>
                <div className="space-y-1 text-sm text-[#333]">
                  <p className="font-bold">{address.fullName}</p>
                  <p>{address.completeAddress}</p>
                  <p>{address.landmark}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                  <p>{address.country}</p>
                  <p className="mt-2 text-xs text-[#777]">T: +91 {address.mobileNo}</p>
                </div>
              </section>
            </div>

            {/* Gift Wrap */}
            <section className="flex items-center gap-3 bg-[#fffaf0] p-6 shadow-sm">
              <input
                type="checkbox"
                id="giftWrap"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                className="h-5 w-5 rounded border-[#d8a734] text-[#d8a734] focus:ring-[#d8a734]"
              />
              <label htmlFor="giftWrap" className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
                <svg className="h-5 w-5 text-[#d8a734]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                Gift wrap (Individual bags) (₹30)
              </label>
            </section>

            {/* Order Notes */}
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#555]">ORDER NOTES</h3>
              <textarea
                rows={4}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Special instructions for delivery or packaging..."
                className="w-full border-none p-4 text-sm text-[#333] shadow-sm focus:ring-1 focus:ring-[#d8a734]"
              />
            </section>

          </div>

          {/* Right Column - Summary */}
          <aside className="space-y-6">
            <div className="bg-[#f4f2ef] p-8">
              <h2 className="mb-6 text-center font-serif text-lg tracking-widest text-[#241f20]">SUMMARY</h2>
              
              <div className="space-y-4 border-b border-[#ddd] pb-6 text-sm text-[#555]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                {giftWrap && (
                  <div className="flex justify-between">
                    <span>Gift Wrap</span>
                    <span>{formatPrice(giftWrapFee)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>₹0</span>
                </div>
              </div>

              <div className="flex justify-between py-6 font-serif text-lg text-[#241f20]">
                <span>Amount Payable</span>
                <span className="font-bold">{formatPrice(amountPayable)}</span>
              </div>

              <div className="mt-2">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#555]">COUPON CODE</p>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Enter Code"
                    className="w-full border-none px-4 py-3 text-sm focus:ring-1 focus:ring-[#d8a734]"
                  />
                  <button className="bg-[#3b1111] px-6 text-xs font-bold text-white transition hover:bg-[#250a0a]">
                    APPLY
                  </button>
                </div>
                <button className="mt-3 w-full text-center text-[10px] text-[#888] hover:text-[#555]">
                  CANCEL
                </button>
              </div>
            </div>

            <button
              onClick={() => alert("CCAvenue payment integration coming soon!")}
              className="w-full bg-[#3b1111] py-4 text-xs font-bold tracking-widest text-white transition hover:bg-[#250a0a]"
            >
              PAY WITH CCAVENUE (HDFC, SBI, ETC..) 💳
            </button>
            
            <button
              onClick={handleRazorpay}
              disabled={isProcessing}
              className="w-full bg-[#3b1111] py-4 text-xs font-bold tracking-widest text-white transition hover:bg-[#250a0a] disabled:opacity-70"
            >
              {isProcessing ? "PROCESSING ORDER..." : "PAY WITH RAZORPAY ⚡"}
            </button>

            <p className="px-8 text-center text-[10px] leading-relaxed text-[#888]">
              By placing your order, you agree to Saree Shop&apos;s{" "}
              <Link href="#" className="underline hover:text-[#555]">Terms of Service</Link> and{" "}
              <Link href="#" className="underline hover:text-[#555]">Privacy Policy</Link>
            </p>

          </aside>
        </div>
      </div>
    </main>
  );
}
