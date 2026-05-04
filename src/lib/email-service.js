import nodemailer from "nodemailer";
import { getFirebaseAdminDb } from "./firebase-admin";
import { fetchImageBuffer } from "./pdf-generator";

/**
 * Sends an email notification to all admins about a new order.
 */
export async function sendAdminOrderNotification(orderData) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("[email-service] SMTP credentials missing. Skipping email notification.");
    return;
  }

  try {
    const db = getFirebaseAdminDb();
    const adminSnapshot = await db.collection("admins").get();
    const adminEmails = adminSnapshot.docs.map(doc => doc.data().email).filter(Boolean);

    // Add fallback admin email from env if present
    if (process.env.ADMIN_EMAIL) {
      const envEmails = process.env.ADMIN_EMAIL.split(",").map(e => e.trim());
      envEmails.forEach(e => {
        if (!adminEmails.includes(e)) adminEmails.push(e);
      });
    }

    if (adminEmails.length === 0) {
      console.warn("[email-service] No admin emails found. Skipping notification.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const attachments = [];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sms-saree-shop.vercel.app";

    const itemsHtmlResults = await Promise.all(orderData.items.map(async (item, index) => {
      let imageUrl = item.images?.[0] || "";
      const cid = `product-${index}`;
      
      // Fetch image buffer to attach as CID
      const buffer = await fetchImageBuffer(imageUrl, baseUrl);
      if (buffer) {
        attachments.push({
          filename: `product-${index}.jpg`,
          content: buffer,
          cid: cid
        });
      }

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <img src="${buffer ? `cid:${cid}` : (imageUrl.startsWith('/') ? baseUrl + imageUrl : imageUrl)}" 
                 alt="${item.name}" 
                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; vertical-align: middle; margin-right: 10px;" />
            <strong>${item.name}</strong>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${item.price.toLocaleString()}</td>
        </tr>
      `;
    }));

    const itemsHtml = itemsHtmlResults.join("");

    const mailOptions = {
      from: `"SMS TEX SAREES" <${SMTP_USER}>`,
      to: adminEmails.join(", "),
      subject: `🛍️ New Order Placed - ${orderData.billId}`,
      attachments: attachments, // This embeds the images
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #efe7dc; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #8b001c; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Order Received!</h1>
            <p style="margin: 5px 0 0; opacity: 0.8;">Order #${orderData.billId}</p>
          </div>
          <div style="padding: 20px;">
            <p>Hello Admin,</p>
            <p>A new order has been placed on <strong>SMS TEX SAREES</strong>. Here are the details:</p>
            
            <div style="background-color: #f9f7f3; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #8b001c; font-size: 16px;">Customer Details</h3>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${orderData.address.fullName}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${orderData.address.mobileNo}</p>
              <p style="margin: 5px 0;"><strong>Address:</strong> ${orderData.address.completeAddress}, ${orderData.address.city}, ${orderData.address.state} - ${orderData.address.pincode}</p>
            </div>

            <h3 style="color: #43242d; border-bottom: 2px solid #8b001c; padding-bottom: 5px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f4f4f4;">
                  <th style="padding: 10px; text-align: left; font-size: 12px;">Product</th>
                  <th style="padding: 10px; text-align: center; font-size: 12px;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-size: 12px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal</td>
                  <td style="padding: 10px; text-align: right;">Rs. ${orderData.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Shipping</td>
                  <td style="padding: 10px; text-align: right;">${orderData.shipping > 0 ? `Rs. ${orderData.shipping.toLocaleString()}` : "FREE"}</td>
                </tr>
                ${orderData.giftWrapFee > 0 ? `
                <tr>
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Gift Wrap</td>
                  <td style="padding: 10px; text-align: right;">Rs. ${orderData.giftWrapFee.toLocaleString()}</td>
                </tr>
                ` : ""}
                <tr style="background-color: #8b001c; color: white;">
                  <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Total Amount</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">Rs. ${orderData.totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || "https://sms-saree-shop.vercel.app"}/admin/orders" 
                 style="background-color: #8b001c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                 View Order in Dashboard
              </a>
            </div>
          </div>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} SMS TEX SAREES. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("[email-service] Admin notification sent successfully.");
  } catch (error) {
    console.error("[email-service] Error sending admin notification:", error.message);
  }
}

/**
 * Sends a reminder email to admins about pending orders.
 * Called by a cron job every 2 hours.
 * Skips sending if there are no pending orders.
 */
export async function sendPendingOrdersReminder() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("[email-service] SMTP credentials missing. Skipping reminder.");
    return { sent: false, reason: "SMTP not configured" };
  }

  try {
    const db = getFirebaseAdminDb();

    // Query only pending orders (not ACCEPTED or SHIPPED)
    const snapshot = await db.collection("orders").orderBy("orderDate", "desc").get();
    const allOrders = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    const pendingOrders = allOrders.filter(
      (o) => !o.status || (o.status !== "ACCEPTED" && o.status !== "SHIPPED")
    );

    // No pending orders → no email
    if (pendingOrders.length === 0) {
      console.log("[email-service] No pending orders. Skipping reminder.");
      return { sent: false, reason: "No pending orders", pendingCount: 0 };
    }

    // Get admin emails
    const adminSnapshot = await db.collection("admins").get();
    const adminEmails = adminSnapshot.docs.map((doc) => doc.data().email).filter(Boolean);
    if (process.env.ADMIN_EMAIL) {
      const envEmails = process.env.ADMIN_EMAIL.split(",").map((e) => e.trim());
      envEmails.forEach((e) => {
        if (!adminEmails.includes(e)) adminEmails.push(e);
      });
    }

    if (adminEmails.length === 0) {
      console.warn("[email-service] No admin emails found. Skipping reminder.");
      return { sent: false, reason: "No admin emails" };
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // Build order rows for the email
    const orderRowsHtml = pendingOrders
      .slice(0, 20) // Show max 20 in email
      .map(
        (order) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${order.billId}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${order.address?.fullName || "N/A"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${order.address?.mobileNo || "N/A"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #8b001c;">Rs. ${order.totalAmount?.toLocaleString() || "0"}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 11px; color: #777;">${new Date(order.orderDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
        </tr>
      `
      )
      .join("");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sms-saree-shop.vercel.app";

    const mailOptions = {
      from: `"SMS TEX SAREES" <${SMTP_USER}>`,
      to: adminEmails.join(", "),
      subject: `⏰ Reminder: ${pendingOrders.length} Pending Order${pendingOrders.length > 1 ? "s" : ""} Need Action`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #efe7dc; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #d8a734; color: #241f20; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px;">⏰ Pending Orders Reminder</h1>
            <p style="margin: 5px 0 0; font-size: 14px;">You have <strong>${pendingOrders.length}</strong> order${pendingOrders.length > 1 ? "s" : ""} waiting for your action</p>
          </div>
          <div style="padding: 20px;">
            <p>Hello Admin,</p>
            <p>The following orders are still <strong style="color: #e53935;">PENDING</strong> and need to be accepted or shipped:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background-color: #f4f4f4;">
                  <th style="padding: 10px; text-align: left; font-size: 11px;">Bill ID</th>
                  <th style="padding: 10px; text-align: left; font-size: 11px;">Customer</th>
                  <th style="padding: 10px; text-align: left; font-size: 11px;">Phone</th>
                  <th style="padding: 10px; text-align: right; font-size: 11px;">Amount</th>
                  <th style="padding: 10px; text-align: left; font-size: 11px;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${orderRowsHtml}
              </tbody>
            </table>

            ${pendingOrders.length > 20 ? `<p style="text-align: center; color: #777; font-size: 12px; margin-top: 10px;">...and ${pendingOrders.length - 20} more pending orders</p>` : ""}

            <div style="margin-top: 25px; text-align: center;">
              <a href="${baseUrl}/admin/orders" 
                 style="background-color: #8b001c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">
                 Go to Order Dashboard →
              </a>
            </div>

            <p style="margin-top: 25px; font-size: 12px; color: #999; text-align: center;">
              This is an automated reminder sent every 2 hours. No email will be sent when all orders are processed.
            </p>
          </div>
          <div style="background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 11px; color: #777;">
            &copy; ${new Date().getFullYear()} SMS TEX SAREES. All rights reserved.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[email-service] Pending orders reminder sent. ${pendingOrders.length} pending orders.`);
    return { sent: true, pendingCount: pendingOrders.length };
  } catch (error) {
    console.error("[email-service] Error sending pending orders reminder:", error.message);
    return { sent: false, reason: error.message };
  }
}

