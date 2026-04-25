"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { shopDetails } from "@/lib/shop";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "700", "900"] });

const navItems = [
  { label: "Home", href: "/" },
  { label: "New Sales", href: "/#new-sales" },
  { label: "All Products", href: "/products" },
  { label: "Couples Collections", href: "/products?collection=couples-collections" },
  { label: "Contact", href: "/#contact" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const res = await fetch("/api/auth/role", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setIsAdmin(data.role === "admin");
        } catch (err) {
          console.error("Failed to fetch role", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateCount = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/cart", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const items = data.items || [];
            setCartCount(items.reduce((total, item) => total + item.quantity, 0));
            return;
          }
        } catch (err) {
          console.error("Cloud cart fetch failed", err);
        }
      }

      const cart = JSON.parse(localStorage.getItem("sareeCart") || "[]");
      setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("saree-cart-change", updateCount);

    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("saree-cart-change", updateCount);
    };
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ead8b7] bg-[#f4f4f4]/95 backdrop-blur-xl shadow-[0_6px_24px_rgba(95,0,21,0.06)]">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8a734] bg-white text-[#8b001c] transition-colors hover:bg-[#fff4b8] lg:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle menu"
          >
            <span className="block h-[1px] w-4 bg-current shadow-[0_4px_0_currentColor,0_-4px_0_currentColor]" />
          </button>

          <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-4" aria-label={`${shopDetails.name} home`}>
            <img
              src="/sms-tex-logo.jpg"
              alt={shopDetails.name}
              loading="eager"
              className="h-14 w-14 shrink-0 rounded-[8px] border border-[#ead8b7] object-cover shadow-sm transition-transform group-hover:scale-[1.03] sm:h-16 sm:w-16"
            />
            <span className="flex min-w-0 flex-col leading-none">
              <span className={`truncate text-xl tracking-[0.10em] text-[#8b001c] sm:text-2xl drop-shadow-sm font-black ${playfair.className}`}>
                SMS Textile Sarees
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#d8a734] sm:text-[11px] sm:tracking-[0.24em]">
                {shopDetails.locationLabel}
              </span>
            </span>
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative text-[13px] font-bold uppercase tracking-[0.08em] text-[#241f20] transition-colors hover:text-[#8b001c]"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-[#d8a734] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/wishlist"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#ead8b7] bg-white text-[#8b001c] transition-all hover:border-[#d8a734] hover:bg-[#fff4b8] hover:shadow-sm"
            aria-label="Wishlist"
          >
            <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </Link>
          <Link
            href="/cart"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-[#ead8b7] bg-white text-[#8b001c] transition-all hover:border-[#d8a734] hover:bg-[#fff4b8] hover:shadow-sm sm:w-auto sm:px-4"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12L6 6Z" />
              <path d="M6 6 5.4 3H3" />
              <path d="M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              <path d="M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
            <span className="hidden text-sm font-bold uppercase tracking-wide sm:inline">Cart</span>
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#d8a734] px-1 text-[10px] font-bold text-[#5f0015] shadow-sm">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <Link
            href={user ? "/profile" : "/login"}
            className="hidden items-center gap-2 rounded-full border border-[#ead8b7] bg-white px-4 py-2 text-sm font-bold tracking-wide text-[#8b001c] transition-all hover:border-[#d8a734] hover:bg-[#fff4b8] hover:shadow-sm sm:flex"
          >
            {user ? "Profile" : "Sign In"}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-2 rounded-full bg-[#8b001c] px-4 py-2 text-sm font-bold tracking-wide text-white transition-all hover:bg-[#5f0015] hover:shadow-sm sm:flex"
            >
              Admin
            </Link>
          )}
        </div>
      </div>

      {isOpen ? (
        <nav
          id="mobile-navigation"
          className="absolute inset-x-0 top-full border-b border-[#ead8b7] bg-[#f4f4f4] px-4 py-6 shadow-xl lg:hidden"
        >
          <div className="mx-auto flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block border-b border-[#ead8b7]/70 pb-3 text-base font-bold tracking-wide text-[#241f20] hover:text-[#8b001c]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/wishlist"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex w-fit items-center justify-center rounded-full border border-[#d8a734] bg-white px-6 py-3 text-sm font-bold tracking-wide text-[#8b001c] transition-colors hover:bg-[#fff4b8] sm:hidden"
            >
              Wishlist
            </Link>
            <Link
              href={user ? "/profile" : "/login"}
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-[#8b001c] px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-[#5f0015] sm:hidden"
            >
              {user ? "My Profile" : "Sign In"}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex w-fit items-center justify-center rounded-full border border-[#d8a734] bg-white px-6 py-3 text-sm font-bold tracking-wide text-[#8b001c] transition-colors hover:bg-[#fff4b8] sm:hidden"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
