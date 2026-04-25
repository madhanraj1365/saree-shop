import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionCookie,
  getAdminCookieOptions,
  isAllowedAdminEmail,
} from "@/lib/admin-auth";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing Firebase ID token." }, { status: 400 });
    }

    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);

    if (!await isAllowedAdminEmail(decodedToken.email)) {
      return NextResponse.json({ error: "This account is not allowed to access admin." }, { status: 403 });
    }

    const sessionCookie = await createAdminSessionCookie(idToken);
    const response = NextResponse.json({ ok: true });

    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, getAdminCookieOptions());

    return response;
  } catch {
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 401 });
  }
}
