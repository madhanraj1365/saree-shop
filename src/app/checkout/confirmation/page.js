"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderConfirmationPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/orders");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-[85vh] bg-[#faf9f8] flex items-center justify-center p-6 text-center">
      <div className="bg-white p-12 rounded-[16px] shadow-lg max-w-sm w-full border border-[#eaeaea] animate-fade-in">
        <div className="w-24 h-24 bg-[#d4edda] text-[#155724] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.11-.66-.19-.31-.54-.51-.92-.51L13.2 3.5c-.32 0-.62.13-.85.35L7.59 8.61c-.38.38-.59.88-.59 1.41V19c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-.12z" />
          </svg>
        </div>
        
        <h1 className="font-serif text-3xl font-bold text-[#241f20] mb-3">Order Placed!</h1>
        <p className="text-[#666] text-sm mb-8">Your order has been successfully processed.</p>
        
        <div className="flex items-center justify-center gap-2 text-[#8b001c] text-sm font-bold">
          <svg className="animate-spin h-5 w-5 text-[#8b001c]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Redirecting to your orders...
        </div>
      </div>
    </main>
  );
}
