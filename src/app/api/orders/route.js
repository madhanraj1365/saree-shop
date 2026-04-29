import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { generateInvoiceBuffer } from "@/lib/pdf-generator";
import { uploadRawBuffer } from "@/lib/cloudinary";

import { sendAdminOrderNotification } from "@/lib/email-service";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const adminAuth = getFirebaseAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const data = await request.json();
    const { items, address, subtotal, shipping, giftWrapFee, totalAmount } = data;

    if (!items || !items.length || !address || !totalAmount) {
      return NextResponse.json({ error: "Missing required order data" }, { status: 400 });
    }

    const billId = `BILL_${Date.now()}`;
    const orderDate = new Date().toISOString();

    // 1. Generate PDF (same function used by the download API)
    const orderDataForPdf = {
      billId,
      items,
      address,
      orderDate,
      subtotal: subtotal || totalAmount,
      shipping: shipping || 0,
      giftWrapFee: giftWrapFee || 0,
      totalAmount,
    };
    const pdfBuffer = await generateInvoiceBuffer(orderDataForPdf, new URL(request.url).origin);

    // 2. Upload to Cloudinary (include .pdf extension so it's served as a PDF)
    const publicId = `invoice_${billId}.pdf`;
    const uploadResult = await uploadRawBuffer(pdfBuffer, "invoices", publicId);
    const pdfUrl = uploadResult.secure_url;

    // 3. Save to Firebase (include all fields so download API can regenerate identical PDF)
    const db = getFirebaseAdminDb();
    const orderDoc = {
      userId,
      billId,
      pdfUrl,
      orderDate,
      paymentStatus: "SUCCESS",
      totalAmount,
      subtotal: subtotal || totalAmount,
      shipping: shipping || 0,
      giftWrapFee: giftWrapFee || 0,
      items,
      address,
      status: "PENDING", // Initial admin status
    };

    await db.collection("orders").doc(billId).set(orderDoc);

    // 4. Send Email Notification to Admins
    // We do this in the background (no await) to keep the response fast for the user
    sendAdminOrderNotification(orderDoc).catch(err => console.error("Email notify error:", err));

    // 5. Clear user cart
    await db.collection("carts").doc(userId).delete();

    return NextResponse.json({ success: true, billId, pdfUrl });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
