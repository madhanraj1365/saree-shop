import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";

export const ADMIN_SESSION_COOKIE = "__session";

/**
 * Checks the Firestore `admins` collection to see if the given email is an admin.
 * Add/remove admins directly from Firebase Console → Firestore → admins collection.
 * Falls back to ADMIN_EMAIL env variable if Firestore check fails.
 */
async function isAdminEmailAllowed(email) {
  if (!email) return false;

  const normalized = String(email).trim().toLowerCase();

  // --- Primary check: Firestore `admins` collection ---
  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db.collection("admins").get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const storedEmail = String(data.email || "").trim().toLowerCase();
      if (storedEmail === normalized) {
        return true;
      }
    }
  } catch (err) {
    console.error("[admin-auth] Firestore check failed, falling back to env var:", err);
  }

  // --- Fallback: ADMIN_EMAIL environment variable ---
  const envEmails = process.env.ADMIN_EMAIL?.trim();
  if (envEmails) {
    const allowed = envEmails
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(normalized)) return true;
  }

  return false;
}

export function getAdminCookieOptions(maxAge = 60 * 60 * 24 * 5) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export async function isAllowedAdminEmail(email) {
  return isAdminEmailAllowed(email);
}

export async function createAdminSessionCookie(idToken) {
  const auth = getFirebaseAdminAuth();
  return auth.createSessionCookie(idToken, { expiresIn: 1000 * 60 * 60 * 24 * 5 });
}

export async function verifyAdminSessionCookie(sessionCookie) {
  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);

    const allowed = await isAllowedAdminEmail(decoded.email);
    if (!allowed) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionCookie(sessionCookie);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
