import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { shopDetails } from "./shop";

// Convert Cloudinary URL to force JPEG format (PDFKit only supports JPEG/PNG)
function toJpegUrl(url) {
  if (!url) return url;
  // Cloudinary URLs: /image/upload/v123/... => /image/upload/f_jpg,q_80/v123/...
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/f_jpg,q_80/");
  }
  return url;
}

// Fetch an image and return a Buffer, or null if it fails
export async function fetchImageBuffer(url, baseUrl = "") {
  if (!url) return null;

  try {
    // Handle local relative paths (e.g., /couples/sky-blue.jpg)
    if (url.startsWith("/")) {
      // Try local filesystem first (works in many environments)
      const localPath = path.join(process.cwd(), "public", url);
      if (fs.existsSync(localPath)) {
        console.log("Loading local product image via FS:", localPath);
        return fs.readFileSync(localPath);
      } 
      
      // If FS fails (common on Vercel for some setups), try fetching via URL
      if (baseUrl) {
        const fullUrl = `${baseUrl}${url}`;
        console.log("Loading local product image via Fetch:", fullUrl);
        const res = await fetch(fullUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      }
      
      console.error("Local image not found via FS or Fetch:", url);
      return null;
    }

    // Handle absolute URLs (External or Cloudinary)
    const jpegUrl = toJpegUrl(url);
    console.log("Fetching remote product image:", jpegUrl);
    const res = await fetch(jpegUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error("Image fetch failed with status:", res.status, "for URL:", jpegUrl);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    console.log("Image fetched successfully, size:", arrayBuffer.byteLength);
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error("Failed to fetch/load image:", url, e.message);
    return null;
  }
}

// Load the shop logo from the public directory
function loadLogo() {
  try {
    const logoPath = path.join(process.cwd(), "public", "sms-tex-logo.jpg");
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath);
    }
  } catch (e) {
    console.error("Failed to load shop logo:", e.message);
  }
  return null;
}

export async function generateInvoiceBuffer(orderData, baseUrl = "") {
  // 1. Pre-fetch all product images BEFORE starting PDF generation
  const imageBuffers = [];
  for (const item of orderData.items) {
    if (item.images && item.images.length > 0) {
      const buf = await fetchImageBuffer(item.images[0], baseUrl);
      imageBuffers.push(buf);
    } else {
      imageBuffers.push(null);
    }
  }

  // 2. Load shop logo
  const logoBuf = loadLogo();

  // 3. Generate the PDF
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];
      const pageWidth = doc.page.width;
      const leftMargin = 40;
      const rightEdge = pageWidth - 40;
      const contentWidth = rightEdge - leftMargin;

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // ═══════════════════════════════════════════════
      // HEADER: Logo + Shop Details | Invoice Info
      // ═══════════════════════════════════════════════

      // Background strip for header
      doc.rect(0, 0, pageWidth, 100).fill("#8b001c");

      // Shop logo
      const logoX = leftMargin + 10;
      if (logoBuf) {
        try {
          doc.image(logoBuf, logoX, 15, { width: 65, height: 65 });
        } catch (e) {
          console.error("Logo embed failed:", e.message);
        }
      }

      // Shop name & details (white text on maroon)
      const textStartX = logoBuf ? logoX + 75 : leftMargin + 10;
      doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold")
        .text(shopDetails.name, textStartX, 20);
      doc.fontSize(8).font("Helvetica").fillColor("#f0d0d0")
        .text(shopDetails.addressLines[0], textStartX, 42)
        .text(`${shopDetails.addressLines[1]}, ${shopDetails.addressLines[2]}`, textStartX, 52)
        .text(`Phone: ${shopDetails.phone} | WhatsApp: ${shopDetails.whatsapp}`, textStartX, 62)
        .text("GST No: 33DummyGST1234Z", textStartX, 72);

      // Invoice label (right side)
      doc.fillColor("#FFD700").fontSize(22).font("Helvetica-Bold")
        .text("INVOICE", rightEdge - 130, 18, { width: 120, align: "right" });
      doc.fillColor("#FFFFFF").fontSize(9).font("Helvetica")
        .text(`Bill ID: ${orderData.billId}`, rightEdge - 170, 48, { width: 160, align: "right" })
        .text(`Date: ${new Date(orderData.orderDate || Date.now()).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, rightEdge - 170, 60, { width: 160, align: "right" })
        .text(`Status: PAID`, rightEdge - 170, 72, { width: 160, align: "right" });

      // ═══════════════════════════════════════════════
      // CUSTOMER DETAILS (Two-column: Bill To | Ship To)
      // ═══════════════════════════════════════════════

      const addrTop = 115;

      // Bill To box
      doc.rect(leftMargin, addrTop, contentWidth / 2 - 5, 75)
        .lineWidth(0.5).strokeColor("#dddddd").stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#8b001c")
        .text("BILL TO", leftMargin + 10, addrTop + 8);
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000")
        .text(orderData.address.fullName || "N/A", leftMargin + 10, addrTop + 22);
      doc.fontSize(8).font("Helvetica").fillColor("#444444")
        .text(`${orderData.address.completeAddress || ""}`, leftMargin + 10, addrTop + 35, { width: contentWidth / 2 - 30 })
        .text(`${orderData.address.city || ""}, ${orderData.address.state || ""} - ${orderData.address.pincode || ""}`, leftMargin + 10, addrTop + 48)
        .text(`Phone: +91 ${orderData.address.mobileNo || "N/A"}`, leftMargin + 10, addrTop + 60);

      // Ship To box
      const shipX = leftMargin + contentWidth / 2 + 5;
      doc.rect(shipX, addrTop, contentWidth / 2 - 5, 75)
        .lineWidth(0.5).strokeColor("#dddddd").stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#8b001c")
        .text("SHIP TO", shipX + 10, addrTop + 8);
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000")
        .text(orderData.address.fullName || "N/A", shipX + 10, addrTop + 22);
      doc.fontSize(8).font("Helvetica").fillColor("#444444")
        .text(`${orderData.address.completeAddress || ""}`, shipX + 10, addrTop + 35, { width: contentWidth / 2 - 30 })
        .text(`${orderData.address.city || ""}, ${orderData.address.state || ""} - ${orderData.address.pincode || ""}`, shipX + 10, addrTop + 48)
        .text(`Phone: +91 ${orderData.address.mobileNo || "N/A"}`, shipX + 10, addrTop + 60);

      // ═══════════════════════════════════════════════
      // PRODUCTS TABLE
      // ═══════════════════════════════════════════════

      const tableTop = addrTop + 90;

      // Table header background
      doc.rect(leftMargin, tableTop, contentWidth, 22).fill("#f5f0e8");

      // Column positions
      const col = {
        sno: leftMargin + 8,
        img: leftMargin + 35,
        name: leftMargin + 95,
        qty: leftMargin + 300,
        price: leftMargin + 365,
        total: leftMargin + 440,
      };

      doc.fontSize(8).font("Helvetica-Bold").fillColor("#333333");
      doc.text("S.No", col.sno, tableTop + 6, { width: 25 });
      doc.text("Product", col.img, tableTop + 6, { width: 200 });
      doc.text("Qty", col.qty, tableTop + 6, { width: 55, align: "right" });
      doc.text("Unit Price", col.price, tableTop + 6, { width: 70, align: "right" });
      doc.text("Total", col.total, tableTop + 6, { width: 70, align: "right" });

      // Table rows
      let y = tableTop + 26;

      for (let i = 0; i < orderData.items.length; i++) {
        const item = orderData.items[i];
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        const imgBuf = imageBuffers[i];
        const rowHeight = imgBuf ? 50 : 20;

        // New page check
        if (y + rowHeight > 720) {
          doc.addPage();
          y = 50;
        }

        // Alternating row background
        if (i % 2 === 0) {
          doc.rect(leftMargin, y - 4, contentWidth, rowHeight + 6).fill("#fafafa");
        }

        doc.fontSize(9).font("Helvetica").fillColor("#000000");

        // S.No
        doc.text(`${i + 1}`, col.sno, y + (imgBuf ? 15 : 2), { width: 25 });

        // Product image
        if (imgBuf) {
          try {
            doc.image(imgBuf, col.img, y, { height: 42 });
          } catch (e) {
            console.error("Image embed failed:", e.message);
          }
        }

        // Product name
        doc.font("Helvetica-Bold").fontSize(9)
          .text(item.name || "Product", col.name, y + (imgBuf ? 5 : 2), { width: 190 });
        if (imgBuf) {
          doc.font("Helvetica").fontSize(7).fillColor("#888888")
            .text("Authentic Handcrafted Saree", col.name, y + 20);
        }

        // Qty, Price, Total
        const numY = y + (imgBuf ? 15 : 2);
        doc.font("Helvetica").fontSize(9).fillColor("#000000");
        doc.text(`${item.quantity || 1}`, col.qty, numY, { width: 55, align: "right" });
        doc.text(`Rs. ${(item.price || 0).toLocaleString("en-IN")}`, col.price, numY, { width: 70, align: "right" });
        doc.font("Helvetica-Bold")
          .text(`Rs. ${itemTotal.toLocaleString("en-IN")}`, col.total, numY, { width: 70, align: "right" });

        y += rowHeight + 8;

        // Row divider line
        doc.strokeColor("#eeeeee").lineWidth(0.5)
          .moveTo(leftMargin, y - 3).lineTo(rightEdge, y - 3).stroke();
      }

      // ═══════════════════════════════════════════════
      // SUMMARY BOX (right-aligned)
      // ═══════════════════════════════════════════════

      const summaryX = rightEdge - 210;
      let summaryY = y + 10;

      // New page check
      if (summaryY > 660) {
        doc.addPage();
        summaryY = 50;
      }

      // Summary box background
      doc.rect(summaryX, summaryY, 210, 95).fill("#f9f7f3");
      doc.rect(summaryX, summaryY, 210, 95).lineWidth(0.5).strokeColor("#d8a734").stroke();

      doc.fontSize(9).font("Helvetica").fillColor("#555555");
      let sLine = summaryY + 10;

      doc.text("Subtotal:", summaryX + 15, sLine, { width: 100 });
      doc.text(`Rs. ${(orderData.subtotal || orderData.totalAmount).toLocaleString("en-IN")}`, summaryX + 115, sLine, { width: 80, align: "right" });
      sLine += 16;

      doc.text("Shipping:", summaryX + 15, sLine, { width: 100 });
      doc.text((orderData.shipping || 0) > 0 ? `Rs. ${orderData.shipping.toLocaleString("en-IN")}` : "Free", summaryX + 115, sLine, { width: 80, align: "right" });
      sLine += 16;

      if ((orderData.giftWrapFee || 0) > 0) {
        doc.text("Gift Wrap:", summaryX + 15, sLine, { width: 100 });
        doc.text(`Rs. ${orderData.giftWrapFee.toLocaleString("en-IN")}`, summaryX + 115, sLine, { width: 80, align: "right" });
        sLine += 16;
      }

      const taxAmount = Math.round(orderData.totalAmount * 0.18);
      doc.fontSize(7).fillColor("#999999")
        .text(`(Incl. GST 18%: Rs. ${taxAmount.toLocaleString("en-IN")})`, summaryX + 15, sLine, { width: 180 });
      sLine += 14;

      // Total line (bold, colored)
      doc.moveTo(summaryX + 10, sLine - 2).lineTo(summaryX + 200, sLine - 2)
        .strokeColor("#d8a734").lineWidth(1).stroke();
      sLine += 5;
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#8b001c")
        .text("TOTAL:", summaryX + 15, sLine, { width: 90 });
      doc.text(`Rs. ${orderData.totalAmount.toLocaleString("en-IN")}`, summaryX + 105, sLine, { width: 90, align: "right" });

      // ═══════════════════════════════════════════════
      // FOOTER
      // ═══════════════════════════════════════════════

      const footerY = 755;

      // Footer divider
      doc.moveTo(leftMargin, footerY).lineTo(rightEdge, footerY)
        .strokeColor("#d8a734").lineWidth(1).stroke();

      // Thank you message
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#8b001c")
        .text("Thank you for shopping with SMS Textile Sarees!", leftMargin, footerY + 10, { width: contentWidth, align: "center" });

      doc.fontSize(7).font("Helvetica").fillColor("#999999")
        .text("This is a computer-generated invoice. No signature required.", leftMargin, footerY + 26, { width: contentWidth, align: "center" })
        .text(`${shopDetails.fullAddress} | ${shopDetails.phone}`, leftMargin, footerY + 36, { width: contentWidth, align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
