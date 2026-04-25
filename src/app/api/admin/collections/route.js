import { NextResponse } from "next/server";
import { addCollection, getCollections, updateCollection } from "@/lib/catalog-store";
import { getAdminSession } from "@/lib/admin-auth";
import { unstable_noStore as noStore } from "next/cache";

export async function GET() {
  noStore();

  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ collections: await getCollections() });
}

export async function POST(request) {
  noStore();

  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const collection = await addCollection(body);

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  noStore();

  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = String(body.slug || "").trim();

    if (!slug) {
      return NextResponse.json({ error: "Collection slug is required." }, { status: 400 });
    }

    const collection = await updateCollection(slug, body);

    return NextResponse.json({ collection });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
