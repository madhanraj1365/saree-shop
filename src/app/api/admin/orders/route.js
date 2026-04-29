import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const db = getFirebaseAdminDb();
    const snapshot = await db.collection("orders").orderBy("orderDate", "desc").get();
    const orders = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin orders fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json();
    const { billId, status } = data;

    if (!billId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    await db.collection("orders").doc(billId).update({ status });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin order update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
