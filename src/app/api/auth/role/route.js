import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";

export async function GET(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ role: "guest" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    const email = decodedToken.email?.toLowerCase();

    console.log("Checking admin status for:", email);

    if (!email) {
      return NextResponse.json({ role: "user" });
    }

    // Check admins collection
    const db = getFirebaseAdminDb();
    const adminQuery = await db.collection("admins").where("email", "==", email).get();

    if (!adminQuery.empty) {
      console.log("Admin found in Firestore collection!");
      return NextResponse.json({ role: "admin" });
    }

    // Fallback: Check ADMIN_EMAIL env variable
    if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.toLowerCase()) {
      console.log("Admin found via ADMIN_EMAIL env variable!");
      return NextResponse.json({ role: "admin" });
    }

    console.log("No admin record found for this email in Firestore or Env.");
    return NextResponse.json({ role: "user" });
  } catch (error) {
    console.error("Auth Role API Error:", error);
    return NextResponse.json({ role: "guest", error: error.message }, { status: 401 });
  }
}
