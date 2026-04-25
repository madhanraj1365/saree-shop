import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";

async function verifyAuth(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split("Bearer ")[1];
  try {
    return await getFirebaseAdminAuth().verifyIdToken(token);
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getFirebaseAdminDb();
  const cartDoc = await db.collection("cart").doc(decodedToken.uid).get();
  
  return NextResponse.json({ items: cartDoc.exists ? cartDoc.data().items : [] });
}

export async function POST(request) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { items } = await request.json();
    const db = getFirebaseAdminDb();
    
    await db.collection("cart").doc(decodedToken.uid).set({
      items,
      updatedAt: new Date()
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
