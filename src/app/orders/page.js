"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/orders/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f4f4f4] py-16 text-center">
        <p className="text-[#8b001c] font-bold animate-pulse">Loading your orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f4] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">My Account</p>
            <h1 className="mt-2 font-serif text-3xl text-[#241f20]">Account Hub</h1>
          </div>
          <button
            onClick={() => {
              import("firebase/auth").then(({ signOut }) => {
                signOut(getFirebaseClientAuth()).then(() => router.push("/"));
              });
            }}
            className="rounded-[4px] border border-[#d8a734] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#8b001c] transition hover:bg-[#fff4b8]"
          >
            Sign Out
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-8 border-b border-[#ead8b7]">
          <Link href="/profile" className="border-b-2 border-transparent pb-2 text-sm font-bold uppercase tracking-widest text-[#555] hover:text-[#8b001c] transition">
            Profile Details
          </Link>
          <Link href="/orders" className="border-b-2 border-[#8b001c] pb-2 text-sm font-bold uppercase tracking-widest text-[#8b001c]">
            My Orders
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded shadow-sm">
            <p className="text-lg text-[#333] mb-6">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/products"
              className="inline-block bg-[#8b001c] px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#5f0015] rounded"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded shadow-sm overflow-hidden border border-[#eaeaea]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#f9f9f9] border-b border-[#eaeaea]">
                    <th className="py-4 px-6 text-xs font-bold text-[#555] uppercase tracking-wider w-16">S.No</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#555] uppercase tracking-wider">Bill Number</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#555] uppercase tracking-wider">Date & Time</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#555] uppercase tracking-wider text-right">Amount</th>
                    <th className="py-4 px-6 text-xs font-bold text-[#555] uppercase tracking-wider text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaeaea]">
                  {orders.map((order, index) => (
                    <tr key={order.billId} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-5 px-6 text-sm text-[#555]">
                        {index + 1}
                      </td>
                      <td className="py-5 px-6 text-sm font-medium text-[#241f20]">
                        {order.billId}
                      </td>
                      <td className="py-5 px-6 text-sm text-[#555]">
                        {new Date(order.orderDate).toLocaleString('en-IN', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-5 px-6 text-sm font-bold text-[#241f20] text-right">
                        Rs. {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-5 px-6 text-right">
                        {order.billId ? (
                          <a
                            href={`/api/orders/download?billId=${order.billId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded border border-[#d8a734] px-4 py-2 text-xs font-bold text-[#8b001c] hover:bg-[#fff4b8] transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Bill
                          </a>
                        ) : (
                          <span className="text-xs text-[#999]">No PDF</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
