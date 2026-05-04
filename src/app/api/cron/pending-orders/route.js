import { NextResponse } from "next/server";
import { sendPendingOrdersReminder } from "@/lib/email-service";

/**
 * Cron endpoint — called every 2 hours by Vercel Cron.
 * Sends a reminder email to admins if there are pending orders.
 * If no pending orders, no email is sent.
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendPendingOrdersReminder();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron/pending-orders] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
