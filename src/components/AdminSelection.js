"use client";

import Link from "next/link";
import AdminLogoutButton from "./AdminLogoutButton";

export default function AdminSelection({ email }) {
  return (
    <main className="min-h-[80vh] bg-[#fbfaf7] flex items-center justify-center">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#94773c]">
            Secure Admin Dashboard
          </p>
          <h1 className="mt-4 font-serif text-5xl text-[#43242d]">
            Welcome Back
          </h1>
          <p className="mt-4 text-[#6d6064]">
            Signed in as <span className="font-bold">{email}</span>. Choose an area to manage.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Option 1: Manage Orders */}
          <Link 
            href="/admin/orders"
            className="group flex flex-col items-center rounded-[24px] border border-[#efe7dc] bg-white p-10 shadow-sm transition-all hover:border-[#d8a734] hover:shadow-xl hover:-translate-y-1"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff9eb] transition-colors group-hover:bg-[#d8a734]/10">
              <svg className="h-10 w-10 text-[#d8a734]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-[#43242d]">Manage Orders</h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-[#6d6064]">
              View all customer orders, process invoices, and update shipping status.
            </p>
            <span className="mt-8 text-xs font-bold uppercase tracking-widest text-[#d8a734] group-hover:underline">
              Enter Order Hub &rarr;
            </span>
          </Link>

          {/* Option 2: Manage Catalog */}
          <Link 
            href="/admin/catalog"
            className="group flex flex-col items-center rounded-[24px] border border-[#efe7dc] bg-white p-10 shadow-sm transition-all hover:border-[#8b001c] hover:shadow-xl hover:-translate-y-1"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fff4f6] transition-colors group-hover:bg-[#8b001c]/10">
              <svg className="h-10 w-10 text-[#8b001c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-[#43242d]">Manage Catalog</h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-[#6d6064]">
              Add new sarees, create collections, update stock and manage product images.
            </p>
            <span className="mt-8 text-xs font-bold uppercase tracking-widest text-[#8b001c] group-hover:underline">
              Enter Catalog Manager &rarr;
            </span>
          </Link>
        </div>

        <div className="mt-12 flex justify-center">
          <AdminLogoutButton />
        </div>
      </div>
    </main>
  );
}
