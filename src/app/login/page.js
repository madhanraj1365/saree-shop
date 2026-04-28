"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

export default function LoginPage() {
  console.log("Redeploy");
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync guest cart & wishlist from localStorage to Firestore
        try {
          const localCart = JSON.parse(localStorage.getItem("sareeCart") || "[]");
          const localWish = JSON.parse(localStorage.getItem("sareeWishlist") || "[]");
          const token = await user.getIdToken();

          if (localCart.length > 0) {
            await fetch("/api/cart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ items: localCart })
            });
            localStorage.removeItem("sareeCart");
          }

          if (localWish.length > 0) {
            await fetch("/api/wishlist", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ items: localWish })
            });
            localStorage.removeItem("sareeWishlist");
          }

          if (localCart.length > 0) {
            // Trigger cart refresh for header
            window.dispatchEvent(new Event("saree-cart-change"));
          }
        } catch (err) {
          console.error("Cloud sync failed", err);
        }

        // User is logged in, redirect
        let redirectUrl = sessionStorage.getItem("postLoginRedirect") || "/profile";
        sessionStorage.removeItem("postLoginRedirect");

        try {
          const token = await user.getIdToken();
          const profileRes = await fetch("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.profile && profileData.profile.name && profileData.profile.address && profileData.profile.phone && profileData.profile.city && profileData.profile.pincode) {
              sessionStorage.setItem("checkoutAddress", JSON.stringify({
                fullName: profileData.profile.name,
                mobileNo: profileData.profile.phone ? profileData.profile.phone.replace("+91", "") : "",
                city: profileData.profile.city,
                pincode: profileData.profile.pincode,
                state: profileData.profile.state,
                completeAddress: profileData.profile.address,
                landmark: profileData.profile.landmark || "",
                country: "India",
                type: profileData.profile.addressType || "HOME",
                isDefaultBilling: profileData.profile.isBillingDefault || false,
                isDefaultShipping: profileData.profile.isShippingDefault || false,
              }));
            } else {
              if (redirectUrl === "/checkout/summary") {
                sessionStorage.setItem("postProfileRedirect", "/checkout/summary");
                redirectUrl = "/profile";
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch profile during login", err);
        }

        router.push(redirectUrl);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleGoogleSignIn() {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setError("");

    try {
      const auth = getFirebaseClientAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the redirect
    } catch (err) {
      setIsLoggingIn(false);
      // Ignore user cancellation errors
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(err.message);
      }
    }
  }

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">
          Customer account
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#43242d] sm:text-5xl">Sign in</h1>

        <div className="mt-10 rounded-[8px] border border-[#efe7dc] bg-[#fbfaf7] p-8 max-w-md">
          {isLoading ? (
            <p className="text-[#6d6064] text-center">Checking authentication...</p>
          ) : (
            <div className="flex flex-col gap-6">
              <p className="text-[#6d6064] text-sm text-center">
                Sign in to manage your profile and speed up checkout.
              </p>

              {error && (
                <div className="rounded-[8px] bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoggingIn}
                className="group relative flex w-full justify-center rounded-[8px] border border-[#d4af37] bg-white px-4 py-3 text-sm font-medium text-[#4a3b32] hover:bg-[#fbf9f6] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 transition-colors disabled:opacity-70"
              >
                {!isLoggingIn && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                      <path d="M1 1h22v22H1z" fill="none" />
                    </svg>
                  </span>
                )}
                {isLoggingIn ? "Signing in..." : "Continue with Google"}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
