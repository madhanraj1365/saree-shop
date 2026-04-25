import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/catalog-store";
import { getAdminSession } from "@/lib/admin-auth";
import { unstable_noStore as noStore } from "next/cache";

export async function PUT(request, { params }) {
  noStore();

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const product = await updateProduct(slug, body);

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  noStore();

  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    await deleteProduct(slug);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
