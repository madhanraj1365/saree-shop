import { NextResponse } from "next/server";
import { addProduct, getProducts } from "@/lib/catalog-store";
import { getAdminSession } from "@/lib/admin-auth";
import { unstable_noStore as noStore } from "next/cache";

export async function GET() {
  noStore();

  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ products: await getProducts() });
}

export async function POST(request) {
  noStore();

  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const product = await addProduct(body);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
