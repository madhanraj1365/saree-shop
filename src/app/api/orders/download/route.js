import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/lib/firebase-admin";
import { generateInvoiceBuffer } from "@/lib/pdf-generator";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get("billId");

    if (!billId) {
      return NextResponse.json({ error: "Missing billId" }, { status: 400 });
    }

    // Verify user is authenticated
    const authHeader = request.headers.get("authorization");
    let userId = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const adminAuth = getFirebaseAdminAuth();
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    }

    // Fetch order from Firebase
    const db = getFirebaseAdminDb();
    const orderDoc = await db.collection("orders").doc(billId).get();

    if (!orderDoc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderDoc.data();

    // Optional: verify user owns this order
    if (userId && orderData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate PDF on the fly from stored order data
    // Debug: log item structure to see if images exist
    if (orderData.items && orderData.items.length > 0) {
      console.log("Order items sample:", JSON.stringify({
        name: orderData.items[0].name,
        hasImages: !!orderData.items[0].images,
        imageCount: orderData.items[0].images?.length || 0,
        firstImage: orderData.items[0].images?.[0]?.substring(0, 80) || "NO IMAGE",
      }));
    }

    const pdfBuffer = await generateInvoiceBuffer({
      billId: orderData.billId,
      items: orderData.items,
      address: orderData.address,
      orderDate: orderData.orderDate,
      subtotal: orderData.subtotal || orderData.totalAmount,
      shipping: orderData.shipping || 0,
      giftWrapFee: orderData.giftWrapFee || 0,
      totalAmount: orderData.totalAmount,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=${billId}.pdf`,
        "Content-Length": pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("PDF download error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
  }
}
