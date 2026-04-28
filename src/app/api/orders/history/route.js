import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const db = getFirebaseAdminDb();
    const snapshot = await db.collection("orders")
      .where("userId", "==", userId)
      .get();

    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Remove sensitive or unnecessary huge arrays from list view
      delete data.items;
      delete data.address;
      orders.push(data);
    });

    // Sort manually to avoid requiring a Firebase composite index
    orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
