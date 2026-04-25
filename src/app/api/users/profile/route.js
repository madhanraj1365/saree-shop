import { NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";
import { getUserProfile, updateUserProfile } from "@/lib/user-store";

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

  const profile = await getUserProfile(decodedToken.uid);
  return NextResponse.json({ profile: profile || {} });
}

export async function POST(request) {
  const decodedToken = await verifyAuth(request);
  if (!decodedToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    if (!data.name || !data.address || !data.phone) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updateData = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: decodedToken.email || data.email || "",
    };

    await updateUserProfile(decodedToken.uid, updateData);
    return NextResponse.json({ success: true, profile: updateData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
