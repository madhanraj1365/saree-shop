"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);
    await fetch("/api/admin/logout", { method: "POST" });

    try {
      await signOut(getFirebaseClientAuth());
    } catch {
      // Session cookie is the important part; ignore client sign-out failures.
    }

    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSubmitting}
      className="rounded-full border border-[#dfc47d] px-4 py-2 text-sm font-semibold text-[#43242d] transition hover:bg-[#fbf7ef] disabled:opacity-70"
    >
      {isSubmitting ? "Signing out..." : "Logout"}
    </button>
  );
}
