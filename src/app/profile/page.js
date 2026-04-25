"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);
      
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setForm({
              name: data.profile.name || currentUser.displayName || "",
              phone: data.profile.phone || "",
              address: data.profile.address || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save profile");
      }

      setMessage("Profile saved successfully!");

      const redirectUrl = sessionStorage.getItem("postProfileRedirect");
      if (redirectUrl) {
        sessionStorage.removeItem("postProfileRedirect");
        router.push(redirectUrl);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await signOut(getFirebaseClientAuth());
    router.push("/");
  }

  if (isLoading) {
    return (
      <main className="mx-auto min-h-[70vh] flex items-center justify-center">
        <p className="text-[#6d6064]">Loading your profile...</p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">
              My Account
            </p>
            <h1 className="mt-3 font-serif text-4xl text-[#43242d] sm:text-5xl">Profile</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="rounded-[8px] border border-[#eaddcf] px-4 py-2 text-sm font-medium text-[#4a3b32] hover:bg-[#fbf9f6]"
          >
            Sign Out
          </button>
        </div>
        
        <div className="mt-10 rounded-[8px] border border-[#efe7dc] bg-[#fbfaf7] p-8 max-w-xl">
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <p className="text-[#6d6064] text-sm">
              Please provide your shipping details. This will be automatically attached to your WhatsApp orders.
            </p>

            <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
              Full Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(current => ({ ...current, name: e.target.value }))}
                className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f] font-normal"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
              Phone Number
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(current => ({ ...current, phone: e.target.value }))}
                className="rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f] font-normal"
                placeholder="+91 93426 26350"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-[#43242d]">
              Full Shipping Address
              <textarea
                value={form.address}
                onChange={(e) => setForm(current => ({ ...current, address: e.target.value }))}
                className="min-h-32 rounded-[8px] border border-[#e7d8bf] px-4 py-3 outline-none focus:border-[#8e1f3f] font-normal"
                placeholder="Street address, City, State, ZIP code"
                required
              />
            </label>

            {error && <p className="text-sm font-medium text-red-700">{error}</p>}
            {message && <p className="text-sm font-medium text-[#2f6b4f]">{message}</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="mt-4 w-fit rounded-[8px] bg-[#8e1f3f] px-8 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#6f1730] disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Details"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
